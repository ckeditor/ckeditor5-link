/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

import LinkEditing from '../src/linkediting';
import LinkCommand from '../src/linkcommand';
import UnlinkCommand from '../src/unlinkcommand';

import VirtualTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/virtualtesteditor';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import { getData as getModelData, setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';
import { isLinkElement } from '../src/utils';

import { downcastAttributeToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';

describe( 'LinkEditing', () => {
	let editor, model;

	beforeEach( () => {
		return VirtualTestEditor
			.create( {
				plugins: [ Paragraph, LinkEditing ]
			} )
			.then( newEditor => {
				editor = newEditor;
				model = editor.model;
			} );
	} );

	it( 'should be loaded', () => {
		expect( editor.plugins.get( LinkEditing ) ).to.be.instanceOf( LinkEditing );
	} );

	it( 'should set proper schema rules', () => {
		expect( model.schema.checkAttribute( [ '$block', '$text' ], 'linkHref' ) ).to.be.true;
		expect( model.schema.checkAttribute( [ '$clipboardHolder', '$text' ], 'linkHref' ) ).to.be.true;

		expect( model.schema.checkAttribute( [ '$block' ], 'linkHref' ) ).to.be.false;
	} );

	describe( 'command', () => {
		it( 'should register link command', () => {
			const command = editor.commands.get( 'link' );

			expect( command ).to.be.instanceOf( LinkCommand );
		} );

		it( 'should register unlink command', () => {
			const command = editor.commands.get( 'unlink' );

			expect( command ).to.be.instanceOf( UnlinkCommand );
		} );
	} );

	describe( 'data pipeline conversions', () => {
		it( 'should convert `<a href="url">` to `linkHref="url"` attribute', () => {
			editor.setData( '<p><a href="url">foo</a>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) )
				.to.equal( '<paragraph><$text linkHref="url">foo</$text>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p><a href="url">foo</a>bar</p>' );
		} );

		it( 'should be integrated with autoparagraphing', () => {
			editor.setData( '<a href="url">foo</a>bar' );

			expect( getModelData( model, { withoutSelection: true } ) )
				.to.equal( '<paragraph><$text linkHref="url">foo</$text>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p><a href="url">foo</a>bar</p>' );
		} );

		// https://github.com/ckeditor/ckeditor5/issues/500
		it( 'should not pick up `<a name="foo">`', () => {
			editor.setData( '<p><a name="foo">foo</a>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) )
				.to.equal( '<paragraph>foobar</paragraph>' );
		} );

		// CKEditor 4 does. And CKEditor 5's balloon allows creating such links.
		it( 'should pick up `<a href="">`', () => {
			editor.setData( '<p><a href="">foo</a>bar</p>' );

			expect( getModelData( model, { withoutSelection: true } ) )
				.to.equal( '<paragraph><$text linkHref="">foo</$text>bar</paragraph>' );

			expect( editor.getData() ).to.equal( '<p><a href="">foo</a>bar</p>' );
		} );
	} );

	describe( 'editing pipeline conversion', () => {
		it( 'should convert attribute', () => {
			setModelData( model, '<paragraph><$text linkHref="url">foo</$text>bar</paragraph>' );

			expect( getViewData( editor.editing.view, { withoutSelection: true } ) ).to.equal( '<p><a href="url">foo</a>bar</p>' );
		} );

		it( 'should convert to link element instance', () => {
			setModelData( model, '<paragraph><$text linkHref="url">foo</$text>bar</paragraph>' );

			const element = editor.editing.view.document.getRoot().getChild( 0 ).getChild( 0 );
			expect( isLinkElement( element ) ).to.be.true;
		} );

		// https://github.com/ckeditor/ckeditor5-link/issues/121
		it( 'should should set priority for `linkHref` higher than all other attribute elements', () => {
			model.schema.extend( '$text', { allowAttributes: 'foo' } );

			editor.conversion.for( 'downcast' ).add( downcastAttributeToElement( { model: 'foo', view: 'f' } ) );

			setModelData( model,
				'<paragraph>' +
					'<$text linkHref="url">a</$text><$text foo="true" linkHref="url">b</$text><$text linkHref="url">c</$text>' +
				'</paragraph>' );

			expect( editor.getData() ).to.equal( '<p><a href="url">a<f>b</f>c</a></p>' );
		} );
	} );
} );