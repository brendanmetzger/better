var worker = new Worker('js/parser.js');

var edges = {};
var taglist = window.taglist || {index: [], tags: []};

var graph = {
  track:{},
  album:{},
  artist:{},
  era:{},
  label:{},
  name:{},
  place:{},
  genre:{},
  tag:{}
};

// this just converts our text into something that we can use as an _id in mongo-- over and over
function encode(string, prefix) {
  var code = '1';
  
  // only care about lowercase, only letters... thus 'power pop = power-pop = PowerPop!
  // -- could be detrimental for instances like 'in tomorrow' 'into morrow', but I think
  //    the benefits outweigh the anomalies...
  
  string = string.toLowerCase().replace(/\W/g, '');
  
  for(letter in string) {
    code += string.charCodeAt(letter).toString();
  }

  return prefix + parseInt(code).toString(36);
}

bootstrap.add(function () {
  var nw = document.id('network');
  
  Object.each(graph, function (value, key) {
    var div = new Element('div', {
      'class': '_1 column',
      'html': '<h2>'+key+'s</h2>'
    }).inject(nw);
    
    value.node = new Element('ul', {
      'id': key,
    }).inject(div);
  });
  
  worker.addEventListener('message', function(e) {
    taglist = {index: e.data.index, tags: e.data.tags};
    document.id('timestamp').set('text', 'Preview last updated: ' + new Date)
    document.id('preview').contentDocument.body.innerHTML = e.data.markup;
    document.id('statistics').set('text', 'Statistics: {chars} characters, {words} words, {tags} tags'.substitute(e.data.statistics))
    
    Object.each(graph, function (value, key) {
      value.node.empty();
    });

    e.data.tags.each(function (tag) {
      graph[tag.type].node.grab(new Element('li', {
        'draggable': true,
        'class': tag.type,
        'id': tag.id,
        'text': tag.name
      }));
      
      
      
    });
  }, false);
  
  
  
  var wheight = window.getSize().y;
  document.id('notebook').setStyle('height',  wheight - 250);
  document.id('preview').setStyle('height',  wheight - 200);
  

});

var Ed = window.Ed || {};

Ed.it = new Class({
  Implements: Events,
  input: null,
  initialize: function (textarea) {
    this.field = document.id(textarea);
    this.cursor = new Ed.cursor(this.field);
    this.buffer = new Ed.buffer;
    this.macro  = new Ed.macro(this.cursor, this.buffer);
    
    this.field.addEventListener('select', function (evt) {
      this.fireEvent('textSelect');
      this.fireEvent('cursor');
    }.bind(this), false);
    
    this.field.addEventListener('click', this.fireEvent.bind(this, 'cursor'), false);
    
    this.field.addEventListener('keydown', function (evt) {
      var key = evt.keyCode;
      /* 
        1. never need to tab-out of the field
        2. sometimes we will want to use the enter as a submit instead of newline
      */
      
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
    

    this.ready.delay(25, this);
    
  },
  ready: function () {
    this.fireEvent('ready');
    this.fireEvent('cursor');
  }
});

Ed.console = new Class({
  // the console should show what commands are avail.
});

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
    this.start = this.getStart();
    this.end = this.getEnd();
    return this.getText().substring(this.start, this.end) || false;
  },
  getPosition: function (attribute){
    return this.field.selectionStart;
  },
  getStart: function (){
    return this.field.selectionStart;
  },
  getEnd: function (){
    return this.field.selectionEnd;
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
  },
  getLastCharacter: function (){
    /*
      TODO implement
    */
  },
  getNextCharacter: function (){
    /*
      TODO implement
    */
  }
  // moveCursor
  // cursorPosition
});


Ed.macro = new Class({
  Implements: Events,
  commands: {
    tab: ['TAG', 'BOLD', 'ITALIC', 'LINK', 'IMAGE'],
    enter : ['%'],
    bracket: []
  },
  codes: [],
  initialize: function (cursor, buffer){
    this.cursor = cursor;
    this.buffer = buffer;
    this.codes[9]   = 'tab';
    this.codes[13]  = 'enter'
    this.codes[219] = 'bracket';
  },
  parse: function (key){
    var trigger = this.codes[key];
    if (trigger == 'tab') {
      var cmd = this.buffer.getBuffer(25).match(/[A-Z]+$/);
      if (cmd && this.commands[trigger].contains(cmd[0])) {
        this[trigger].call(this.cursor, cmd[0]);
        this.fireEvent(cmd[0]);
      }
    } else if (trigger == 'bracket') {
      this[trigger].call(this.cursor);
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
        var end = cmd.length;
        var begin = this.getStart() - end;
        var tags = ['genre','era','place','album','artist','label','name','tag','track'].join(' ');
        this.replace(new RegExp("([^]{"+(begin)+"})[^]{"+end+"}([^]*)", 'm'), "$1"+tags+"$2");
        this.field.setSelectionRange(begin, begin + tags.length);
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

    var startCursor = this.getStart();
    var endCursor = startCursor + 7
    var text = this.getText();
    
    if (startCursor == text.length) {
      this.setText(text + 'REPLACE]');
      this.field.setSelectionRange(startCursor, endCursor);
      return;
    }
    var re = new RegExp("([^]{"+startCursor+"})([^]*)", 'm');
    this.replace(re, "$1REPLACE]$2");
    this.field.setSelectionRange(startCursor, endCursor);
  }
});

Ed.tagger = new Class({
  container: null,
  tags: ['genre','era','place','album','artist','label','name','tag','track'],
  initialize: function (container) {
    this.tagger = document.id(container);
    this.tag    = {
      node: new Element('span', {
        html: "<em>select text to tag</em> <code>&rarr;</code>"
      }).inject(this.tagger),
      object: null,
    };
    this.list   = new Element('ul', {
      'class': 'container'
    }).inject(this.tagger).addEvent('click:relay(input)', this.change.bind(this));
    this.graph   = new Element('ul', {
      'class': 'graph container'
    }).inject(this.tagger)
  },
  getTags: function (join){
    return join ? this.tags.join(join) : this.tags;
  },
  addTag: function (text, range){
    var excluded = this.excludeText(text);
    /*
      TODO first check range using taglist!
    */
    if (! excluded) {
      this.tag.object = {range:range,name:text};
      this.tag.node.set('html', '<code>&darr; pick[</code>'+text+'<code>]</code>').className = '';
      this.addSelectionBlock();
    } else {
      this.tag.node.set('html', '<span class="error">'+excluded+'</span>').className = '';
    }
    
  },
  change: function (evt, input){
    var FOLDTHISIN = document.id('selection');
    
    if (this.tag.object.type) {
      var re = RegExp("([^]{" + this.tag.object.range[0] + "})" + this.tag.object.type + "([^]*)", 'm');
      FOLDTHISIN.value = FOLDTHISIN.value.replace(re, "$1"+input.value+"$2");
    } else {
      var re = RegExp("([^]{" + this.tag.object.range[0] + "})(" + this.tag.object.name + ")([^]*)", 'm');
      FOLDTHISIN.value = FOLDTHISIN.value.replace(re, "$1" + input.value + "[$2]$3");
    }
    
    this.list.empty();
    this.tag.node.set('html', '<code>'+input.value+'[</code>'+this.tag.object.name+'<code>]</code>').className = input.value;
    worker.postMessage(FOLDTHISIN.value);
    this.tag.object.id = encode(this.tag.object.name, input.value.slice(0,3));
    this.tag.object.type = input.value;
    this.updateGraph();
  },
  edit: function (tag){
    this.tag.object = tag;
    this.tag.node.set('html', '<code>'+tag.type+'[</code>'+tag.name+'<code>]</code>').className = tag.type;
    this.addSelectionBlock(tag.type);
  },
  addSelectionBlock: function (type){
    this.list.empty();
    
    this.getTags().each(function (tag) {
      this.list.grab(new Element('li', {
        'class': tag,
      }).adopt(boxes(tag, tag == type, 'radio')));
    }, this);
  },
  excludeText: function (text){
    var re = new RegExp("^("+this.getTags('|')+")|[\[]", "g");
    matches = text.match(re);
    if (text.length >= 50) {
          // the longest band names I could find with a quick good were between 42-45
          return 'The text is too long (' +text.length+' characters)';
    } else if (matches) {
      return '<strong>'+matches[0] + '</strong> is a reserved keyword';
    }
    return false;
  },
  updateGraph: function (){

    this.graph.empty();
    taglist.tags.sort(function (a, b) {
      if (a.type > b.type) return -1;
      else if (a.type < b.type) return 1;
      return 0;
    }).each(function (tag) {
      if (this.tag.object.type == tag.type) return;
      this.graph.grab(new Element('li', {
        'class': tag.type
      }).adopt(boxes(tag.name, false, 'checkbox')));
    }, this);
  }
});

var boxes = function (tag, selected, type) {
  return [
    new Element('input', {
      'type': type,
      'name': 'tag',
      'value': tag,
      'checked': selected ? 'checked' : false,
      'id': '_' + tag
    }),
    new Element('label', {
      'for': '_' + tag,
      'text': tag,
    })
  ];
};