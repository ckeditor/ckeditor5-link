/**
 * @license Copyright (c) 2003-2016, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import ModelTestEditor from '/tests/core/_utils/modeltesteditor.js';
import LinkCommand from '/ckeditor5/link/linkcommand.js';
import { setData, getData } from '/tests/engine/_utils/model.js';

describe( 'LinkCommand', () => {
	let editor, document, command;

	beforeEach( () => {
		return ModelTestEditor.create()
			.then( newEditor => {
				editor = newEditor;
				document = editor.document;
				command = new LinkCommand( editor );

				// Allow text in $root.
				document.schema.allow( { name: '$text', inside: '$root' } );

				// Allow text with link attribute in paragraph.
				document.schema.registerItem( 'p', '$block' );
				document.schema.allow( { name: '$text', attributes: 'link', inside: '$root' } );
			} );
	} );

	afterEach( () => {
		command.destroy();
	} );

	describe( 'hasValue', () => {
		describe( 'collapsed selection', () => {
			it( 'should be equal `true` when selection is placed inside element with link attribute', () => {
				setData( document, `<$text link="url">foo[]bar</$text>` );

				expect( command.hasValue ).to.true;
			} );

			it( 'should be equal `false` when selection is placed inside element without link attribute', () => {
				setData( document, `<$text bold="true">foo[]bar</$text>` );

				expect( command.hasValue ).to.false;
			} );
		} );

		describe( 'non-collapsed selection', () => {
			it( 'should be equal `true` when selection contains only elements with link attribute', () => {
				setData( document, 'fo[<$text link="url">ob</$text>]ar' );

				expect( command.hasValue ).to.true;
			} );

			it( 'should be equal `false` when selection contains not only elements with link attribute', () => {
				setData( document, 'f[o<$text link="url">ob</$text>]ar' );

				expect( command.hasValue ).to.false;
			} );
		} );
	} );

	describe( '_doExecute', () => {
		describe( 'non-collapsed selection', () => {
			it( 'should set link attribute to selected text', () => {
				setData( document, 'f[ooba]r' );

				expect( command.hasValue ).to.false;

				command._doExecute( 'url' );

				expect( getData( document ) ).to.equal( 'f[<$text link="url">ooba</$text>]r' );
				expect( command.hasValue ).to.true;
			} );

			it( 'should set link attribute to selected text when text already has attributes', () => {
				setData( document, 'f[o<$text bold="true">oba]r</$text>' );

				expect( command.hasValue ).to.false;

				command._doExecute( 'url' );

				expect( command.hasValue ).to.true;
				expect( getData( document ) )
					.to.equal( 'f[<$text link="url">o</$text><$text bold="true" link="url">oba</$text>]<$text bold="true">r</$text>' );
			} );

			it( 'should overwrite existing link attribute when selected text wraps text with link attribute', () => {
				setData( document, 'f[o<$text link="other url">o</$text>ba]r' );

				expect( command.hasValue ).to.false;

				command._doExecute( 'url' );

				expect( getData( document ) ).to.equal( 'f[<$text link="url">ooba</$text>]r' );
				expect( command.hasValue ).to.true;
			} );

			it( 'should split text and overwrite attribute value when selection is inside text with link attribute', () => {
				setData( document, 'f<$text link="other url">o[ob]a</$text>r' );

				expect( command.hasValue ).to.true;

				command._doExecute( 'url' );

				expect( getData( document ) )
					.to.equal( 'f<$text link="other url">o</$text>[<$text link="url">ob</$text>]<$text link="other url">a</$text>r' );
				expect( command.hasValue ).to.true;
			} );

			it( 'should overwrite link attribute of selected text only, when selection start inside text with link attribute', () => {
				setData( document, 'f<$text link="other url">o[o</$text>ba]r' );

				expect( command.hasValue ).to.true;

				command._doExecute( 'url' );

				expect( getData( document ) ).to.equal( 'f<$text link="other url">o</$text>[<$text link="url">oba</$text>]r' );
				expect( command.hasValue ).to.true;
			} );

			it( 'should overwrite link attribute of selected text only, when selection end inside text with link attribute', () => {
				setData( document, 'f[o<$text link="other url">ob]a</$text>r' );

				expect( command.hasValue ).to.false;

				command._doExecute( 'url' );

				expect( getData( document ) ).to.equal( 'f[<$text link="url">oob</$text>]<$text link="other url">a</$text>r' );
				expect( command.hasValue ).to.true;
			} );

			it( 'should set link attribute to selected text when text is split by $block element', () => {
				setData( document, '<p>f[oo</p><p>ba]r</p>' );

				expect( command.hasValue ).to.false;

				command._doExecute( 'url' );

				expect( getData( document ) )
					.to.equal( '<p>f[<$text link="url">oo</$text></p><p><$text link="url">ba</$text>]r</p>' );
				expect( command.hasValue ).to.true;
			} );

			it( 'should set link attribute only to allowed elements and omit disallowed', () => {
				// Disallow text in img.
				document.schema.registerItem( 'img', '$block' );
				document.schema.disallow( { name: '$text', attributes: 'link', inside: 'img' } );

				setData( document, '<p>f[oo<img></img>ba]r</p>' );

				expect( command.hasValue ).to.false;

				command._doExecute( 'url' );

				expect( getData( document ) )
					.to.equal( '<p>f[<$text link="url">oo</$text><img></img><$text link="url">ba</$text>]r</p>' );
				expect( command.hasValue ).to.true;
			} );
		} );

		describe( 'collapsed selection', () => {
			it( 'should insert text with link attribute and data equal to href', () => {
				setData( document, 'foo[]bar' );

				command._doExecute( 'url' );

				expect( getData( document ) ).to.equal( 'foo[<$text link="url">url</$text>]bar' );
			} );

			it( 'should insert text with link attribute and data equal to href when selection is inside text with link attribute', () => {
				setData( document, '<$text link="other url">foo[]bar</$text>' );

				command._doExecute( 'url' );

				expect( getData( document ) )
					.to.equal( '<$text link="other url">foo</$text>[<$text link="url">url</$text>]<$text link="other url">bar</$text>' );
			} );

			it( 'should not insert text with link attribute when is not allowed in parent', () => {
				document.schema.disallow( { name: '$text', attributes: 'link', inside: 'p' } );
				setData( document, '<p>foo[]bar</p>' );

				command._doExecute( 'url' );

				expect( getData( document ) ).to.equal( '<p>foo[]bar</p>' );
			} );
		} );
	} );

	describe( '_checkEnabled', () => {
		// This test doesn't tests every possible case.
		// Method `_checkEnabled` uses `isAttributeAllowedInSelection` helper which is fully tested in his own test.

		beforeEach( () => {
			document.schema.registerItem( 'x', '$block' );
			document.schema.disallow( { name: '$text', inside: 'x', attributes: 'link' } );
		} );

		describe( 'when selection is collapsed', () => {
			it( 'should return true if characters with the attribute can be placed at caret position', () => {
				setData( document, '<p>f[]oo</p>' );
				expect( command._checkEnabled() ).to.be.true;
			} );

			it( 'should return false if characters with the attribute cannot be placed at caret position', () => {
				setData( document, '<x>fo[]o</x>' );
				expect( command._checkEnabled() ).to.be.false;
			} );
		} );

		describe( 'when selection is not collapsed', () => {
			it( 'should return true if there is at least one node in selection that can have the attribute', () => {
				setData( document, '<p>[foo]</p>' );
				expect( command._checkEnabled() ).to.be.true;
			} );

			it( 'should return false if there are no nodes in selection that can have the attribute', () => {
				setData( document, '<x>[foo]</x>' );
				expect( command._checkEnabled() ).to.be.false;
			} );
		} );
	} );
} );