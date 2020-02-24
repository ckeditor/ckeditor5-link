/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals console, window, document, ClassicEditor, CS_CONFIG */

ClassicEditor
	.create( document.querySelector( '#snippet-link' ), {
		cloudServices: CS_CONFIG,
		toolbar: {
			viewportTopOffset: window.getViewportTopOffsetConfig()
		}
	} )
	.then( editor => {
		window.editor = editor;

		window.pinTourBalloon( editor, {
			message: 'Click this button to create a new link.',
			target: document.querySelector( '.ck-editor__top .ck-toolbar .ck-button:nth-of-type( 3 )' ),
			positions: [
				'southArrowNorthWest'
			]
		} );
	} )
	.catch( err => {
		console.error( err.stack );
	} );
