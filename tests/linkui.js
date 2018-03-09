/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document, Event */

import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import { setData as setModelData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { getData as getViewData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import LinkEditing from '../src/linkediting';
import LinkUI from '../src/linkui';
import LinkFormView from '../src/ui/linkformview';
import LinkActionsView from '../src/ui/linkactionsview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Range from '@ckeditor/ckeditor5-engine/src/view/range';
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';

testUtils.createSinonSandbox();

describe( 'LinkUI', () => {
	let editor, linkUIFeature, linkButton, balloon, formView, actionsView, editorElement;

	beforeEach( () => {
		editorElement = document.createElement( 'div' );
		document.body.appendChild( editorElement );

		return ClassicTestEditor
			.create( editorElement, {
				plugins: [ LinkEditing, LinkUI, Paragraph ]
			} )
			.then( newEditor => {
				editor = newEditor;

				linkUIFeature = editor.plugins.get( LinkUI );
				linkButton = editor.ui.componentFactory.create( 'link' );
				balloon = editor.plugins.get( ContextualBalloon );
				formView = linkUIFeature.formView;
				actionsView = linkUIFeature.actionsView;

				// There is no point to execute BalloonPanelView attachTo and pin methods so lets override it.
				testUtils.sinon.stub( balloon.view, 'attachTo' ).returns( {} );
				testUtils.sinon.stub( balloon.view, 'pin' ).returns( {} );

				formView.render();
			} );
	} );

	afterEach( () => {
		editorElement.remove();

		return editor.destroy();
	} );

	it( 'should load ContextualBalloon', () => {
		expect( editor.plugins.get( ContextualBalloon ) ).to.be.instanceOf( ContextualBalloon );
	} );

	describe( 'init', () => {
		it( 'should register click observer', () => {
			expect( editor.editing.view.getObserver( ClickObserver ) ).to.be.instanceOf( ClickObserver );
		} );

		it( 'should create #actionsView', () => {
			expect( actionsView ).to.be.instanceOf( LinkActionsView );
		} );

		it( 'should create #formView', () => {
			expect( formView ).to.be.instanceOf( LinkFormView );
		} );

		describe( 'link toolbar button', () => {
			it( 'should be registered', () => {
				expect( linkButton ).to.be.instanceOf( ButtonView );
			} );

			it( 'should be bound to the link command', () => {
				const command = editor.commands.get( 'link' );

				command.isEnabled = true;
				expect( linkButton.isEnabled ).to.be.true;

				command.isEnabled = false;
				expect( linkButton.isEnabled ).to.be.false;
			} );

			it( 'should call #_showUI upon #execute', () => {
				const spy = testUtils.sinon.stub( linkUIFeature, '_showUI' ).returns( {} );

				linkButton.fire( 'execute' );
				sinon.assert.calledWithExactly( spy );
			} );
		} );
	} );

	describe( '_showUI()', () => {
		let balloonAddSpy;

		beforeEach( () => {
			balloonAddSpy = testUtils.sinon.spy( balloon, 'add' );
			editor.editing.view.document.isFocused = true;
		} );

		it( 'should not work if the link command is disabled', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );
			editor.commands.get( 'link' ).isEnabled = false;

			linkUIFeature._showUI();

			expect( balloon.visibleView ).to.be.null;
		} );

		it( 'should not throw if the UI is already visible', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );

			linkUIFeature._showUI();

			expect( () => {
				linkUIFeature._showUI();
			} ).to.not.throw();
		} );

		it( 'should add #formView to the balloon and attach the balloon to the selection when text fragment is selected', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );
			const selectedRange = editorElement.ownerDocument.getSelection().getRangeAt( 0 );

			linkUIFeature._showUI();

			expect( balloon.visibleView ).to.equal( formView );
			sinon.assert.calledWithExactly( balloonAddSpy, {
				view: formView,
				position: {
					target: selectedRange
				}
			} );
		} );

		it( 'should add #formView to the balloon and attach the balloon to the selection when selection is collapsed', () => {
			setModelData( editor.model, '<paragraph>f[]oo</paragraph>' );
			const selectedRange = editorElement.ownerDocument.getSelection().getRangeAt( 0 );

			linkUIFeature._showUI();

			expect( balloon.visibleView ).to.equal( formView );
			sinon.assert.calledWithExactly( balloonAddSpy, {
				view: formView,
				position: {
					target: selectedRange
				}
			} );
		} );

		it( 'should add #actionsView to the balloon and attach the balloon to the link element when collapsed selection is inside ' +
			'that link',
		() => {
			setModelData( editor.model, '<paragraph><$text linkHref="url">f[]oo</$text></paragraph>' );
			const linkElement = editor.editing.view.getDomRoot().querySelector( 'a' );

			linkUIFeature._showUI();

			expect( balloon.visibleView ).to.equal( actionsView );
			sinon.assert.calledWithExactly( balloonAddSpy, {
				view: actionsView,
				position: {
					target: linkElement
				}
			} );
		} );

		it( 'should disable #formView and #actionsView elements when link and unlink commands are disabled', () => {
			setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );

			linkUIFeature._showUI();

			editor.commands.get( 'link' ).isEnabled = true;
			editor.commands.get( 'unlink' ).isEnabled = true;

			expect( formView.urlInputView.isReadOnly ).to.be.false;
			expect( formView.saveButtonView.isEnabled ).to.be.true;
			expect( formView.cancelButtonView.isEnabled ).to.be.true;

			expect( actionsView.unlinkButtonView.isEnabled ).to.be.true;
			expect( actionsView.editButtonView.isEnabled ).to.be.true;

			editor.commands.get( 'link' ).isEnabled = false;
			editor.commands.get( 'unlink' ).isEnabled = false;

			expect( formView.urlInputView.isReadOnly ).to.be.true;
			expect( formView.saveButtonView.isEnabled ).to.be.false;
			expect( formView.cancelButtonView.isEnabled ).to.be.true;

			expect( actionsView.unlinkButtonView.isEnabled ).to.be.false;
			expect( actionsView.editButtonView.isEnabled ).to.be.false;
		} );

		// https://github.com/ckeditor/ckeditor5-link/issues/78
		it( 'should make sure the URL input in the #formView always stays in sync with the value of the command (selected link)', () => {
			setModelData( editor.model, '<paragraph><$text linkHref="url">f[]oo</$text></paragraph>' );

			// Mock some leftover value **in DOM**, e.g. after previous editing.
			formView.urlInputView.inputView.element.value = 'leftover';

			linkUIFeature._showUI();
			actionsView.fire( 'edit' );

			expect( formView.urlInputView.inputView.element.value ).to.equal( 'url' );
		} );

		// https://github.com/ckeditor/ckeditor5-link/issues/123
		it( 'should make sure the URL input in the #formView always stays in sync with the value of the command (no link selected)', () => {
			setModelData( editor.model, '<paragraph>f[]oo</paragraph>' );

			linkUIFeature._showUI();
			expect( formView.urlInputView.inputView.element.value ).to.equal( '' );
		} );

		describe( 'response to view#change', () => {
			let view, viewDocument;

			beforeEach( () => {
				view = editor.editing.view;
				viewDocument = view.document;
			} );

			it( 'should not duplicate #change listeners', () => {
				setModelData( editor.model, '<paragraph>f[]oo</paragraph>' );

				const spy = testUtils.sinon.stub( balloon, 'updatePosition' ).returns( {} );

				linkUIFeature._showUI();
				view.render();
				linkUIFeature._hideUI();

				linkUIFeature._showUI();
				view.render();
				sinon.assert.calledTwice( spy );
			} );

			// https://github.com/ckeditor/ckeditor5-link/issues/113
			it( 'updates the position of the panel – editing a link, then the selection remains in the link', () => {
				setModelData( editor.model, '<paragraph><$text linkHref="url">f[]oo</$text></paragraph>' );

				linkUIFeature._showUI();
				const spy = testUtils.sinon.stub( balloon, 'updatePosition' ).returns( {} );

				expect( getViewData( view ) ).to.equal(
					'<p><a href="url"><span class="ck-link_selected">f{}oo</span></a></p>'
				);

				const root = viewDocument.getRoot();
				const linkElement = root.getChild( 0 ).getChild( 0 );
				const text = linkElement.getChild( 0 ).getChild( 0 );

				// Move selection to foo[].
				view.change( writer => {
					writer.setSelection( Range.createFromParentsAndOffsets( text, 3, text, 3 ), true );
				} );

				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, {
					target: view.domConverter.mapViewToDom( linkElement )
				} );
			} );

			// https://github.com/ckeditor/ckeditor5-link/issues/113
			it( 'updates the position of the panel – creating a new link, then the selection moved', () => {
				setModelData( editor.model, '<paragraph>f[]oo</paragraph>' );

				linkUIFeature._showUI();
				const spy = testUtils.sinon.stub( balloon, 'updatePosition' ).returns( {} );

				// Fires #render.
				const root = viewDocument.getRoot();
				const text = root.getChild( 0 ).getChild( 0 );

				view.change( writer => {
					writer.setSelection( Range.createFromParentsAndOffsets( text, 3, text, 3 ), true );
				} );

				sinon.assert.calledOnce( spy );
				sinon.assert.calledWithExactly( spy, {
					target: editorElement.ownerDocument.getSelection().getRangeAt( 0 )
				} );
			} );

			// https://github.com/ckeditor/ckeditor5-link/issues/113
			it( 'hides of the panel – editing a link, then the selection moved out of the link', () => {
				setModelData( editor.model, '<paragraph><$text linkHref="url">f[]oo</$text>bar</paragraph>' );

				linkUIFeature._showUI();

				const spyUpdate = testUtils.sinon.stub( balloon, 'updatePosition' ).returns( {} );
				const spyHide = testUtils.sinon.spy( linkUIFeature, '_hideUI' );

				const root = viewDocument.getRoot();
				const text = root.getChild( 0 ).getChild( 1 );

				// Move selection to b[]ar.
				view.change( writer => {
					writer.setSelection( Range.createFromParentsAndOffsets( text, 1, text, 1 ), true );
				} );

				sinon.assert.calledOnce( spyHide );
				sinon.assert.notCalled( spyUpdate );
			} );

			// https://github.com/ckeditor/ckeditor5-link/issues/113
			it( 'hides the panel – editing a link, then the selection expands', () => {
				setModelData( editor.model, '<paragraph><$text linkHref="url">f[]oo</$text></paragraph>' );

				linkUIFeature._showUI();

				const spyUpdate = testUtils.sinon.stub( balloon, 'updatePosition' ).returns( {} );
				const spyHide = testUtils.sinon.spy( linkUIFeature, '_hideUI' );

				expect( getViewData( view ) ).to.equal( '<p><a href="url"><span class="ck-link_selected">f{}oo</span></a></p>' );

				const root = viewDocument.getRoot();
				const text = root.getChild( 0 ).getChild( 0 ).getChild( 0 ).getChild( 0 );

				// Move selection to f[o]o.
				view.change( writer => {
					writer.setSelection( Range.createFromParentsAndOffsets( text, 1, text, 2 ), true );
				} );

				sinon.assert.calledOnce( spyHide );
				sinon.assert.notCalled( spyUpdate );
			} );

			// https://github.com/ckeditor/ckeditor5-link/issues/113
			it( 'hides the panel – creating a new link, then the selection moved to another parent', () => {
				setModelData( editor.model, '<paragraph>f[]oo</paragraph><paragraph>bar</paragraph>' );

				linkUIFeature._showUI();

				const spyUpdate = testUtils.sinon.stub( balloon, 'updatePosition' ).returns( {} );
				const spyHide = testUtils.sinon.spy( linkUIFeature, '_hideUI' );

				const root = viewDocument.getRoot();
				const text = root.getChild( 1 ).getChild( 0 );

				// Move selection to f[o]o.
				view.change( writer => {
					writer.setSelection( Range.createFromParentsAndOffsets( text, 1, text, 2 ), true );
				} );

				sinon.assert.calledOnce( spyHide );
				sinon.assert.notCalled( spyUpdate );
			} );
		} );
	} );

	describe( '_hideUI()', () => {
		beforeEach( () => {
			linkUIFeature._showUI();
		} );

		it( 'should remove the UI from the balloon', () => {
			expect( balloon.hasView( formView ) ).to.be.true;
			expect( balloon.hasView( actionsView ) ).to.be.true;

			linkUIFeature._hideUI();

			expect( balloon.hasView( formView ) ).to.be.false;
			expect( balloon.hasView( actionsView ) ).to.be.false;
		} );

		it( 'should focus the `editable` by default', () => {
			const spy = testUtils.sinon.spy( editor.editing.view, 'focus' );

			linkUIFeature._hideUI();

			// First call is from _removeFormView.
			sinon.assert.calledTwice( spy );
		} );

		it( 'should not throw an error when views are not in the `balloon`', () => {
			linkUIFeature._hideUI();

			expect( () => {
				linkUIFeature._hideUI();
			} ).to.not.throw();
		} );

		it( 'should clear #render listener from the ViewDocument', () => {
			const spy = sinon.spy();

			linkUIFeature.listenTo( editor.editing.view, 'render', spy );
			linkUIFeature._hideUI();
			editor.editing.view.change( () => {} );

			sinon.assert.notCalled( spy );
		} );
	} );

	describe( 'keyboard support', () => {
		it( 'should show the UI on Ctrl+K keystroke', () => {
			const spy = testUtils.sinon.stub( linkUIFeature, '_showUI' ).returns( {} );
			const command = editor.commands.get( 'link' );

			command.isEnabled = false;

			editor.keystrokes.press( {
				keyCode: keyCodes.k,
				ctrlKey: true,
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			} );
			sinon.assert.notCalled( spy );

			command.isEnabled = true;

			editor.keystrokes.press( {
				keyCode: keyCodes.k,
				ctrlKey: true,
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			} );
			sinon.assert.calledWithExactly( spy );
		} );

		it( 'should prevent default action on Ctrl+K keystroke', () => {
			const preventDefaultSpy = sinon.spy();
			const stopPropagationSpy = sinon.spy();

			editor.keystrokes.press( {
				keyCode: keyCodes.k,
				ctrlKey: true,
				preventDefault: preventDefaultSpy,
				stopPropagation: stopPropagationSpy
			} );

			sinon.assert.calledOnce( preventDefaultSpy );
			sinon.assert.calledOnce( stopPropagationSpy );
		} );

		it( 'should focus the the #actionsView on `Tab` key press when #actionsView is visible', () => {
			const keyEvtData = {
				keyCode: keyCodes.tab,
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			};

			const normalPriorityTabCallbackSpy = sinon.spy();
			const highestPriorityTabCallbackSpy = sinon.spy();
			editor.keystrokes.set( 'Tab', normalPriorityTabCallbackSpy );
			editor.keystrokes.set( 'Tab', highestPriorityTabCallbackSpy, { priority: 'highest' } );

			// Balloon is invisible, form not focused.
			actionsView.focusTracker.isFocused = false;

			const spy = sinon.spy( actionsView, 'focus' );

			editor.keystrokes.press( keyEvtData );
			sinon.assert.notCalled( keyEvtData.preventDefault );
			sinon.assert.notCalled( keyEvtData.stopPropagation );
			sinon.assert.notCalled( spy );
			sinon.assert.calledOnce( normalPriorityTabCallbackSpy );
			sinon.assert.calledOnce( highestPriorityTabCallbackSpy );

			// Balloon is visible, form focused.
			linkUIFeature._showUI();
			testUtils.sinon.stub( linkUIFeature, '_areActionsVisible' ).value( true );

			actionsView.focusTracker.isFocused = true;

			editor.keystrokes.press( keyEvtData );
			sinon.assert.notCalled( keyEvtData.preventDefault );
			sinon.assert.notCalled( keyEvtData.stopPropagation );
			sinon.assert.notCalled( spy );
			sinon.assert.calledTwice( normalPriorityTabCallbackSpy );
			sinon.assert.calledTwice( highestPriorityTabCallbackSpy );

			// Balloon is still visible, form not focused.
			actionsView.focusTracker.isFocused = false;

			editor.keystrokes.press( keyEvtData );
			sinon.assert.calledOnce( keyEvtData.preventDefault );
			sinon.assert.calledOnce( keyEvtData.stopPropagation );
			sinon.assert.calledOnce( spy );
			sinon.assert.calledTwice( normalPriorityTabCallbackSpy );
			sinon.assert.calledThrice( highestPriorityTabCallbackSpy );
		} );

		it( 'should hide the UI after Esc key press (from editor) and not focus the editable', () => {
			const spy = testUtils.sinon.spy( linkUIFeature, '_hideUI' );
			const keyEvtData = {
				keyCode: keyCodes.esc,
				preventDefault: sinon.spy(),
				stopPropagation: sinon.spy()
			};

			// Balloon is visible.
			linkUIFeature._showUI();
			editor.keystrokes.press( keyEvtData );

			sinon.assert.calledWithExactly( spy );
		} );

		it( 'should not hide the UI after Esc key press (from editor) when UI is open but is not visible', () => {
			const spy = testUtils.sinon.spy( linkUIFeature, '_hideUI' );
			const keyEvtData = {
				keyCode: keyCodes.esc,
				preventDefault: () => {},
				stopPropagation: () => {}
			};

			const viewMock = {
				ready: true,
				render: () => {},
				destroy: () => {}
			};

			linkUIFeature._showUI();

			// Some view precedes the link UI in the balloon.
			balloon.add( { view: viewMock } );
			editor.keystrokes.press( keyEvtData );

			sinon.assert.notCalled( spy );
		} );
	} );

	describe( 'mouse support', () => {
		it( 'should hide the UI and not focus editable upon clicking outside the UI', () => {
			const spy = testUtils.sinon.spy( linkUIFeature, '_hideUI' );

			linkUIFeature._showUI( true );
			document.body.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

			sinon.assert.calledWithExactly( spy );
		} );

		it( 'should not hide the UI upon clicking inside the the UI', () => {
			const spy = testUtils.sinon.spy( linkUIFeature, '_hideUI' );

			linkUIFeature._showUI( true );
			balloon.view.element.dispatchEvent( new Event( 'mousedown', { bubbles: true } ) );

			sinon.assert.notCalled( spy );
		} );

		describe( 'clicking on editable', () => {
			let observer, spy;

			beforeEach( () => {
				observer = editor.editing.view.getObserver( ClickObserver );
				editor.model.schema.extend( '$text', { allowIn: '$root' } );

				spy = testUtils.sinon.stub( linkUIFeature, '_showUI' ).returns( {} );
			} );

			it( 'should show the UI when collapsed selection is inside link element', () => {
				setModelData( editor.model, '<$text linkHref="url">fo[]o</$text>' );

				observer.fire( 'click', { target: document.body } );
				sinon.assert.calledWithExactly( spy );
			} );

			it( 'should show the UI when selection exclusively encloses a link element (#1)', () => {
				setModelData( editor.model, '[<$text linkHref="url">foo</$text>]' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.calledWithExactly( spy );
			} );

			it( 'should show the UI when selection exclusively encloses a link element (#2)', () => {
				setModelData( editor.model, '<$text linkHref="url">[foo]</$text>' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.calledWithExactly( spy );
			} );

			it( 'should do nothing when selection is not inside link element', () => {
				setModelData( editor.model, '[]' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.notCalled( spy );
			} );

			it( 'should do nothing when selection is non-collapsed and doesn\'t enclose a link element (#1)', () => {
				setModelData( editor.model, '<$text linkHref="url">f[o]o</$text>' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.notCalled( spy );
			} );

			it( 'should do nothing when selection is non-collapsed and doesn\'t enclose a link element (#2)', () => {
				setModelData( editor.model, '<$text linkHref="url">[fo]o</$text>' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.notCalled( spy );
			} );

			it( 'should do nothing when selection is non-collapsed and doesn\'t enclose a link element (#3)', () => {
				setModelData( editor.model, '<$text linkHref="url">f[oo]</$text>' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.notCalled( spy );
			} );

			it( 'should do nothing when selection is non-collapsed and doesn\'t enclose a link element (#4)', () => {
				setModelData( editor.model, 'ba[r<$text linkHref="url">foo]</$text>' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.notCalled( spy );
			} );

			it( 'should do nothing when selection is non-collapsed and doesn\'t enclose a link element (#5)', () => {
				setModelData( editor.model, 'ba[r<$text linkHref="url">foo</$text>]' );

				observer.fire( 'click', { target: {} } );
				sinon.assert.notCalled( spy );
			} );
		} );
	} );

	describe( 'actions view', () => {
		let focusEditableSpy;

		beforeEach( () => {
			focusEditableSpy = testUtils.sinon.spy( editor.editing.view, 'focus' );
		} );

		it( 'should mark the editor UI as focused when the #actionsView is focused', () => {
			linkUIFeature._showUI();
			linkUIFeature._removeFormView();

			expect( balloon.visibleView ).to.equal( actionsView );

			editor.ui.focusTracker.isFocused = false;
			actionsView.element.dispatchEvent( new Event( 'focus' ) );

			expect( editor.ui.focusTracker.isFocused ).to.be.true;
		} );

		describe( 'binding', () => {
			it( 'should show the #formView on #edit event and select the URL input field', () => {
				linkUIFeature._showUI();
				linkUIFeature._removeFormView();

				const selectSpy = testUtils.sinon.spy( formView.urlInputView, 'select' );
				actionsView.fire( 'edit' );

				expect( balloon.visibleView ).to.equal( formView );
				sinon.assert.calledOnce( selectSpy );
			} );

			it( 'should execute unlink command on actionsView#unlink event', () => {
				const executeSpy = testUtils.sinon.spy( editor, 'execute' );

				actionsView.fire( 'unlink' );

				expect( executeSpy.calledOnce ).to.be.true;
				expect( executeSpy.calledWithExactly( 'unlink' ) ).to.be.true;
			} );

			it( 'should hide and focus editable on actionsView#unlink event', () => {
				linkUIFeature._showUI();
				linkUIFeature._removeFormView();

				// Removing the form would call the focus spy.
				focusEditableSpy.resetHistory();
				actionsView.fire( 'unlink' );

				expect( balloon.visibleView ).to.be.null;
				expect( focusEditableSpy.calledOnce ).to.be.true;
			} );

			it( 'should hide after Esc key press', () => {
				const keyEvtData = {
					keyCode: keyCodes.esc,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				linkUIFeature._showUI();
				linkUIFeature._removeFormView();

				// Removing the form would call the focus spy.
				focusEditableSpy.resetHistory();

				actionsView.keystrokes.press( keyEvtData );
				expect( balloon.visibleView ).to.equal( null );
				expect( focusEditableSpy.calledOnce ).to.be.true;
			} );
		} );
	} );

	describe( 'link form view', () => {
		let focusEditableSpy;

		beforeEach( () => {
			focusEditableSpy = testUtils.sinon.spy( editor.editing.view, 'focus' );
		} );

		it( 'should mark the editor UI as focused when the #formView is focused', () => {
			linkUIFeature._showUI();
			expect( balloon.visibleView ).to.equal( formView );

			editor.ui.focusTracker.isFocused = false;
			formView.element.dispatchEvent( new Event( 'focus' ) );

			expect( editor.ui.focusTracker.isFocused ).to.be.true;
		} );

		describe( 'binding', () => {
			beforeEach( () => {
				setModelData( editor.model, '<paragraph>f[o]o</paragraph>' );
			} );

			it( 'should bind formView.urlInputView#value to link command value', () => {
				const command = editor.commands.get( 'link' );

				expect( formView.urlInputView.value ).to.undefined;

				command.value = 'http://cksource.com';
				expect( formView.urlInputView.value ).to.equal( 'http://cksource.com' );
			} );

			it( 'should execute link command on formView#submit event', () => {
				const executeSpy = testUtils.sinon.spy( editor, 'execute' );

				formView.urlInputView.value = 'http://ckeditor.com';
				expect( formView.urlInputView.inputView.element.value ).to.equal( 'http://ckeditor.com' );

				formView.urlInputView.inputView.element.value = 'http://cksource.com';
				formView.fire( 'submit' );

				expect( executeSpy.calledOnce ).to.be.true;
				expect( executeSpy.calledWithExactly( 'link', 'http://cksource.com' ) ).to.be.true;
			} );

			it( 'should hide and reveal the #actionsView on formView#submit event', () => {
				linkUIFeature._showUI();
				formView.fire( 'submit' );

				expect( balloon.visibleView ).to.equal( actionsView );
				expect( focusEditableSpy.calledOnce ).to.be.true;
			} );

			it( 'should hide and reveal the #actionsView on formView#cancel event', () => {
				linkUIFeature._showUI();
				formView.fire( 'cancel' );

				expect( balloon.visibleView ).to.equal( actionsView );
				expect( focusEditableSpy.calledOnce ).to.be.true;
			} );

			it( 'should hide after Esc key press', () => {
				const keyEvtData = {
					keyCode: keyCodes.esc,
					preventDefault: sinon.spy(),
					stopPropagation: sinon.spy()
				};

				linkUIFeature._showUI();

				formView.keystrokes.press( keyEvtData );
				expect( balloon.visibleView ).to.equal( actionsView );
				expect( focusEditableSpy.calledOnce ).to.be.true;
			} );
		} );
	} );
} );
