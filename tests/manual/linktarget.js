/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console:false, window, document */

import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Enter from '@ckeditor/ckeditor5-enter/src/enter';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import Link from '../../src/link';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Undo from '@ckeditor/ckeditor5-undo/src/undo';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { downcastAttributeToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { upcastAttributeToAttribute } from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';

class LinkTarget extends Plugin {
	init() {
		const editor = this.editor;

		editor.model.schema.extend( '$text', { allowAttributes: 'linkTarget' } );

		editor.conversion.for( 'downcast' ).add( downcastAttributeToElement( {
			model: 'linkTarget',
			view: ( attributeValue, writer ) => {
				return writer.createAttributeElement( 'a', { target: attributeValue }, { priority: 5 } );
			},
			converterPriority: 'low'
		} ) );

		editor.conversion.for( 'upcast' ).add( upcastAttributeToAttribute( {
			view: {
				name: 'a',
				key: 'target'
			},
			model: 'linkTarget',
			converterPriority: 'low'
		} ) );
	}
}

ClassicEditor
	.create( document.querySelector( '#editor' ), {
		plugins: [ Link, Typing, Paragraph, Undo, Enter, LinkTarget ],
		toolbar: [ 'link', 'undo', 'redo' ]
	} )
	.then( editor => {
		window.editor = editor;
	} )
	.catch( err => {
		console.error( err.stack );
	} );
