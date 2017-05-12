/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/**
 * @module link/unlinkcommand
 */

import Command from '@ckeditor/ckeditor5-core/src/command/command';
import findLinkRange from './findlinkrange';

/**
 * The unlink command. It is used by the {@link module:link/link~Link link plugin}.
 *
 * @extends module:core/command/command~Command
 */
export default class UnlinkCommand extends Command {
	/**
	 * @see module:core/command/command~Command
	 * @param {module:core/editor/editor~Editor} editor
	 */
	constructor( editor ) {
		super( editor );

		// Checks when command should be enabled or disabled.
		this.listenTo( editor.document.selection, 'change:attribute', () => this.refreshState() );

		// Determine the initial state of the command.
		// https://github.com/ckeditor/ckeditor5-link/issues/93
		this.refreshState();
	}

	/**
	 * Executes the command.
	 *
	 * When the selection is collapsed, removes `linkHref` attribute from each node with the same `linkHref` attribute value.
	 * When the selection is non-collapsed, removes `linkHref` from each node in selected ranges.
	 *
	 * @protected
	 */
	_doExecute() {
		const document = this.editor.document;
		const selection = document.selection;

		document.enqueueChanges( () => {
			// Get ranges to unlink.
			const rangesToUnlink = selection.isCollapsed ?
				[ findLinkRange( selection.getFirstPosition(), selection.getAttribute( 'linkHref' ) ) ] : selection.getRanges();

			// Keep it as one undo step.
			const batch = document.batch();

			// Remove `linkHref` attribute from specified ranges.
			for ( let range of rangesToUnlink ) {
				batch.removeAttribute( range, 'linkHref' );
			}
		} );
	}

	/**
	 * Checks if selection has `linkHref` attribute.
	 *
	 * @protected
	 * @returns {Boolean}
	 */
	_checkEnabled() {
		return this.editor.document.selection.hasAttribute( 'linkHref' );
	}
}
