var worker = new Worker('js/parser.js');

var edges = {};

bootstrap.add(function () {
  worker.addEventListener('message', function(e) {
    document.id('timestamp').set('text', 'Preview last updated: ' + new Date)
    document.id('preview').contentDocument.body.innerHTML = e.data.markup;
    document.id('statistics').set('text', 'Statistics: {chars} characters, {words} words, {tags} tags'.substitute(e.data.statistics))
    var nw = document.id('network');
    nw.empty();
    
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

  findMetadata(document.getElementById('selection').value);
  
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
      console.log(matches)
      return matches[0] + ' is a reserved keyword';
    } else if (text.length >= 50) {
      // the longest band names I could find with a quick good were between 42-45
      return 'the text is too long (' +text.length+' characters)';
    }
    return false;
  }
})


