var worker = new Worker('js/parser.js');

var edges = {};


var graph = {
  track:{},
  tag:{},
  place:{},
  name:{},
  label:{},
  genre:{},
  era:{},
  artist:{},
  album:{}
  


  
  
  
  
  
};

bootstrap.add(function () {
  var nw = document.id('network');
  Object.each(graph, function (value, key) {
    value.node = new Element('ul', {
      'id': key,
      'class': '_1 column',
      'html': '<li><h2>'+key+'s</h2></li>'
    }).inject(nw);
  });
  
  worker.addEventListener('message', function(e) {
    document.id('timestamp').set('text', 'Preview last updated: ' + new Date)
    document.id('preview').contentDocument.body.innerHTML = e.data.markup;
    document.id('statistics').set('text', 'Statistics: {chars} characters, {words} words, {tags} tags'.substitute(e.data.statistics))
    var nw = document.id('network');
    
    for(method in nw) {
      // console.log(method);
    }
    
    var group = {id:null};
    e.data.tags.sort(function (a, b) {
      if (a.type > b.type) return -1;
      else if (a.type < b.type) return 1;
      return 0;
      
    }).each(function (tag) {
      if (group.id != tag.type) {
        group = new Element('ul', {
          'id': tag.type,
          'class': '_1 column',
          'html': '<li><h2>'+tag.type+'s</h2></li>'
        }).inject(nw);
      }
      
      var vertice = new Element('li', {
        'draggable': true,
        'class': tag.type,
        'id': tag.id,
        'text': tag.name
      }).inject(group);
      
      
      
    });
  }, false);
  
  
  var notepad = document.getElementById('selection');
  var size = window.getComputedStyle(notepad, null).getPropertyValue("line-height");
  var bg = btoa("<svg xmlns='http://www.w3.org/2000/svg' width='"+size+"' height='"+size+"' viewBox='0 0 50 50'><line x1='0' y1='50' x2='50' y2='50' stroke='#9DD1EF' fill='none'/></svg>");
  bg = 'transparent url(data:image/svg+xml;base64,'+bg+') repeat 0 1px' ;
  
  notepad.style.background = bg;
  var textarea = document.getElementById('selection');
  textarea.focus();
  findMetadata(textarea.value);
  
  var wheight = window.getSize().y;
  document.id('notebook').setStyle('height',  wheight - 250);
  document.id('preview').setStyle('height',  wheight - 200);
  

});

function gcd(a, b) {
  if (b) {
    return gcd(b, a % b);
  } else {
    return Math.abs(a);
  }
}


var Ed = window.Ed || {};



// has an event interface
Ed.buffer = new Class({
  Implements: Events,
  // onBufferEmpty
  // getBuffer
  // setBuffer
  stack: null,
  last: null,
  size: 50,
  initialize: function () {
    this.stack = new Array();
  },
  
  record: function (key){
    this.last = key;
    this.stack.push(key);
    if (this.stack.length > this.size) {
      this.stack.shift();
    }
  },
  play: function (callback){
    this.stack.each(callback)
  },
  getBuffer: function (len){
    return this.stack.slice(-len).map(function (key) {
      return String.fromCharCode(key);
    }).join('');
  }
});

Ed.cursor = new Class({
  start:null,
  end: null,
  initialize: function (field){
    this.field = field;
  },
  getText: function () {
    return this.field.value;
  },
  getSelectedText: function (){
    this.start = this.field.selectionStart;
    this.end   = this.field.selectionEnd;
    return this.getText().substring(this.start, this.end) || false;
  },
  getPosition: function (attribute){
    return this.field.selectionStart;
  },
  getLength: function (){
    return this.getText().length;
  },
  setText: function (text, range){
    // if range included, will be a find/replace operation
    this.field.value = text;
  },
  replace: function (re, replace){
    this.setText(this.getText().replace(re, replace));
  }
  // moveCursor
  // cursorPosition
});

Ed.it = new Class({
  Implements: Events,
  input: null,
  initialize: function (textarea) {
    this.field = document.id(textarea);
    this.cursor = new Ed.cursor(this.field);
    this.buffer = new Ed.buffer;
    this.macro  = new Ed.trigger(this.cursor, this.buffer);
    
    this.field.addEventListener('select', function (evt) {
      this.fireEvent('textSelect');
      this.fireEvent('cursor');
    }.bind(this), false);
    
    this.field.addEventListener('keydown', function (evt) {
      var key = evt.keyCode;
      if (key == 9 || (key == 13 && this.cursor.getSelectedText())) {
        evt.preventDefault();
        return;
      }
      this.buffer.record(key);
    }.bind(this), false);
    
    this.field.addEventListener('keyup', function (evt) {
      this.macro.parse(evt.keyCode);
      this.fireEvent('cursor');
      this.fireEvent('textInput');
      
    }.bind(this), false);
  }

  // find
  // replace
});

Ed.trigger = new Class({
  Implements: Events,
  commands: {
    tab: ['TAG', 'BOLD', 'ITALIC', 'LINK', 'IMAGE'],
    enter : ['%']
  },
  codes: [],
  trigger: null,
  initialize: function (cursor, buffer){
    this.cursor = cursor;
    this.buffer = buffer;
    this.codes[9]   = 'tab';
    this.codes[13]  = 'enter'
    this.codes[219] = 'bracket';
  },
  parse: function (key){
    this.trigger = this.codes[key];
    if (this.trigger) {
      var cmd = this.buffer.getBuffer(10).match(/[A-Z]+$/);
      if (cmd && this.commands[this.trigger].contains(cmd[0])) {
        this[this.trigger].call(this.cursor, cmd[0]);
        this.fireEvent(cmd[0]);
      }
      
    } 
  },
  tab: function (cmd){
    // console.log(this, cmd);
      // we need to know the next character, to do some better matching. ie
      // tag(tab)someword should produce tag|artist|album|etc|something[someword], and you tab through the results,
      // where someword would be the breselected text, or a default value like REPLACE, would want to do an operation based on,
      // selection, like it it was a link or image, then do some kind of analysis
    if (cmd == 'TAG') {
      var categories = ['genre','era','place','album','artist','label','name','tag','track'];
      var text = this.getSelectedText();
      if (categories.contains(text)) {
        console.log('cycle through commands, hit enter when done.');
      } else {
	      console.log(cmd);
        var startCursor = this.start - cmd.length;
        var endCursor = this.end - cmd.length;

        var re = new RegExp("([^]{"+(startCursor)+"})[^]{"+cmd.length+"}([^]*)", 'm');
        
        this.replace(re, "$1artist$2")
  
        this.field.setSelectionRange(startCursor, endCursor + 'artist'.length - cmd.length);
      }
      
    }
    
    var next = this.getText().substr(this.selectionStart, 1);
    if (next === ']') {
      this.setSelectionRange(startCursor+1, startCursor+1);
    } else if (next === '[') {
      console.log('skip entire block');
    }
  },
  enter: function (buf){
    console.log(this, buf);
  },
  bracket: function (buf){
    console.log(this, buf);
  }
});

var tagger = new Class({
  container: null,
  tags: ['genre','era','place','album','artist','label','name','tag','track'],
  initialize: function (elem) {
    this.tagger = document.id(elem);
  },
  addTag: function (text, startCursor, endCursor){
    var excluded = this.excludeText(text);
    if (! excluded) {
      this.tagger.set('text', text);
    } else {
      this.tagger.set('html', '<span class="error">We cannot add this text because '+excluded+'</span>')
    }
    
  },
  excludeText: function (text){
    var re = new RegExp("^("+this.tags.join('|')+")|[\[]", "g");
    matches = text.match(re);
    if (matches) {
      return matches[0] + ' is a reserved keyword';
    } else if (text.length >= 50) {
      // the longest band names I could find with a quick good were between 42-45
      return 'the text is too long (' +text.length+' characters)';
    }
    return false;
  }
})


