/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import Feature from '../core/feature.js';
import buildModelConverter from '../engine/conversion/buildmodelconverter.js';
import buildViewConverter from '../engine/conversion/buildviewconverter.js';
import AttributeElement from '../engine/view/attributeelement.js';
import LinkCommand from './linkcommand.js';

/**
 * The link engine feature.
 *
 * It introduces the `link="url"` attribute in the model which renders to the view as a `<a href="url">` element.
 *
 * @memberOf link
 * @extends core.Feature
 */
export default class LinkEngine extends Feature {
	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const data = editor.data;
		const editing = editor.editing;

		// Allow link attribute on all inline nodes.
		editor.document.schema.allow( { name: '$inline', attributes: [ 'link' ] } );

		// Build converter from model to view for data and editing pipelines.
		buildModelConverter().for( data.modelToView, editing.modelToView )
			.fromAttribute( 'link' )
			.toElement( ( href ) => new AttributeElement( 'a', { href } ) );

		// Build converter from view to model for data pipeline.
		buildViewConverter().for( data.viewToModel )
			.fromElement( 'a' )
			.toAttribute( ( viewElement ) => ( {
				key: 'link',
				value: viewElement.getAttribute( 'href' )
			} ) );

		// Create link command.
		editor.commands.set( 'link', new LinkCommand( editor ) );
	}
}