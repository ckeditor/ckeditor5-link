/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module link/linkediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {
	downcastAttributeToElement,
	downcastMarkerToHighlight
} from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { upcastElementToAttribute } from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';
import LinkCommand from './linkcommand';
import UnlinkCommand from './unlinkcommand';
import { createLinkElement } from './utils';
import bindTwoStepCaretToAttribute from '@ckeditor/ckeditor5-engine/src/utils/bindtwostepcarettoattribute';
import findLinkRange from './findlinkrange';
import '../theme/link.css';

/**
 * The link engine feature.
 *
 * It introduces the `linkHref="url"` attribute in the model which renders to the view as a `<a href="url">` element.
 *
 * @extends module:core/plugin~Plugin
 */
export default class LinkEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Allow link attribute on all inline nodes.
		editor.model.schema.extend( '$text', { allowAttributes: 'linkHref' } );

		editor.conversion.for( 'downcast' )
			.add( downcastAttributeToElement( { model: 'linkHref', view: createLinkElement } ) );

		editor.conversion.for( 'upcast' )
			.add( upcastElementToAttribute( {
				view: {
					name: 'a',
					attribute: {
						href: true
					}
				},
				model: {
					key: 'linkHref',
					value: viewElement => viewElement.getAttribute( 'href' )
				}
			} ) );

		// Create linking commands.
		editor.commands.add( 'link', new LinkCommand( editor ) );
		editor.commands.add( 'unlink', new UnlinkCommand( editor ) );

		// Enable two-step caret movement for `linkHref` attribute.
		bindTwoStepCaretToAttribute( editor.editing.view, editor.model, this, 'linkHref' );

		// Setup highlight over selected link.
		this._setupLinkHighlight();
	}

	/**
	 * Adds highlight over link which has selection inside, together with two-step caret movement indicates whenever
	 * user is typing inside the link.
	 *
	 * @private
	 */
	_setupLinkHighlight() {
		const editor = this.editor;
		const model = this.editor.model;
		const doc = model.document;
		const highlightDescriptor = {
			id: 'linkBoundaries',
			class: 'ck-link_selected',
			// Priority higher than link priority, but lower than default one.
			priority: 7
		};

		// Convert linkBoundaries marker to view highlight.
		editor.conversion.for( 'editingDowncast' )
			.add( downcastMarkerToHighlight( {
				model: 'linkBoundaries',
				view: highlightDescriptor
			} ) );

		// Create marker over whole link when selection has "linkHref" attribute.
		doc.registerPostFixer( writer => {
			const selection = doc.selection;
			const marker = model.markers.get( 'linkBoundaries' );

			// Create marker over link when selection is inside or remove marker otherwise.
			if ( selection.hasAttribute( 'linkHref' ) ) {
				const modelRange = findLinkRange( selection.getFirstPosition(), selection.getAttribute( 'linkHref' ) );

				if ( !marker || !marker.getRange().isEqual( modelRange ) ) {
					writer.setMarker( 'linkBoundaries', modelRange );
					return true;
				}
			} else if ( marker ) {
				writer.removeMarker( 'linkBoundaries' );
				return true;
			}

			return false;
		} );
	}
}
