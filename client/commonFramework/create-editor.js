window.common = (function(global) {
  const {
    Rx: { Subject, Observable },
    CodeMirror,
    emmetCodeMirror,
    Clipboard,
    common = { init: [] }
  } = global;

  const { challengeType = '0', challengeTypes } = common;

  if (
    !CodeMirror ||
    challengeType === challengeTypes.BASEJUMP ||
    challengeType === challengeTypes.ZIPLINE ||
    challengeType === challengeTypes.VIDEO ||
    challengeType === challengeTypes.STEP ||
    challengeType === challengeTypes.HIKES
  ) {
    common.editor = {};
    return common;
  }

  var editor = CodeMirror.fromTextArea(
    document.getElementById('codeEditor'),
    {
      lint: true,
      lineNumbers: true,
      mode: 'javascript',
      theme: 'monokai',
      runnable: true,
      matchBrackets: true,
      autoCloseBrackets: true,
      scrollbarStyle: 'null',
      lineWrapping: true,
      gutters: ['CodeMirror-lint-markers']
    }
  );

  var clipboard = new Clipboard('.demo1', {
    text: function(trigger) {
      var type;
      switch (common.challengeType) {
        case common.challengeTypes.HTML:
          type = 'html';
          break;
        case common.challengeTypes.JS:
        case common.challengeTypes.BONFIRE:
          type = 'javascript';
          break;
        default:
          type = '';
      }

      var returnValue = '';
      if (trigger.id === 'markdown') {
        returnValue = '```' + type + '\n' + editor.getSelection() + '\n```';
        editor.replaceSelection(editor.getSelection());
        return returnValue;
      } else if (trigger.id === 'plain') {
        returnValue = editor.getSelection();
        editor.replaceSelection(editor.getSelection());
        return returnValue;
      } else if (trigger.id === 'link') {
        editor.replaceSelection(editor.getSelection());
        return '[Challenge - ' + common.challengeName +
        (common.username ? ' (' + common.username + '\'s solution)' : '')
        + '](' + window.location + ')';
      }
    }
  });

  common.clipboard = clipboard;
  common.CodeMirror = CodeMirror;
  editor.setSize('100%', 'auto');

  common.editorExecute$ = new Subject();
  common.editorKeyUp$ = Observable.fromEventPattern(
    (handler) => editor.on('keyup', handler),
    (handler) => editor.off('keyup', handler)
  );

  editor.setOption('extraKeys', {
    Tab: function(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection('add');
      } else {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      }
    },
    'Shift-Tab': function(cm) {
      if (cm.somethingSelected()) {
        cm.indentSelection('subtract');
      } else {
        var spaces = Array(cm.getOption('indentUnit') + 1).join(' ');
        cm.replaceSelection(spaces);
      }
    },
    'Ctrl-Enter': function() {
      common.editorExecute$.onNext();
      return false;
    },
    'Cmd-Enter': function() {
      common.editorExecute$.onNext();
      return false;
    }
  });


  var info = editor.getScrollInfo();

  var after = editor.charCoords({
    line: editor.getCursor().line + 1,
    ch: 0
  }, 'local').top;

  if (info.top + info.clientHeight < after) {
    editor.scrollTo(null, after - info.clientHeight + 3);
  }

  if (emmetCodeMirror) {
    emmetCodeMirror(
      editor,
      {
        'Cmd-E': 'emmet.expand_abbreviation',
        Tab: 'emmet.expand_abbreviation_with_tab',
        Enter: 'emmet.insert_formatted_line_break_only'
      }
    );
  }
  common.init.push(function() {
    let editorValue;
    if (common.codeUri.isAlive()) {
      editorValue = common.codeUri.parse();
    } else {
      editorValue = common.codeStorage.isAlive(common.challengeName) ?
        common.codeStorage.getStoredValue(common.challengeName) :
        common.seed;
    }

    editor.setValue(common.replaceSafeTags(editorValue));
    editor.refresh();
  });

  common.editor = editor;

  return common;
}(window));
