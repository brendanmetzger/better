importScripts('marked.js');

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

self.addEventListener('message', function(e) {
  var message = e.data;
  message = message.replace(/(\d\d)\:(\d\d)\:(\d\d)/gm, function (match, hrs, min, sec) {
          var seconds = (parseInt(hrs) * 3600) + (parseInt(min) * 60) + parseInt(sec);
          return '<em style="color:green">(@'+seconds+' seconds in)</em>';
        });
  var markdown = '';
  var tags = [];
  markdown += marked(message.replace(/(genre|era|place|album|artist|label|name|tag|track)\[([^[]*)\]/g, function (match, type, tag) {
    var id = encode(tag, type.slice(0,3));
    tags.push({type: type, name: tag, id: id});
    return '<span rel="'+id+'" class="'+type+'">'+tag+'</span>'
  }));
  
  var stats = {
    words: e.data.split(/\s/).length,
    chars: e.data.length,
    tags: tags.length
  }
  self.postMessage({markup:markdown, tags: tags, statistics: stats});
  
}, false);