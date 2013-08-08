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
  var markdown = '';
  var tags = [];
  var counter = 1;
  var index = new Uint8Array(message.length);
  
  // alway do tagging first - it relies heavily on placement of cursor, and creates an index of the spot of each tag, which is important for the interface.
  message = message.replace(/\{(genre|era|place|album|artist|label|name|tag|track)\:\s?([^{]*)\}/g, function (match, type, tag, position) {
    var id = encode(tag, type.slice(0,3));
    var end = (position + type.length + tag.length + 2);
    var range = [position, end];
    while (position<=end+1) {
      index[position++] = counter;
    }
    tags[counter] = {type: type, name: tag, id: id, range: range};
    counter++;
    return '<span rel="'+id+'" class="'+type+'" data-begin="'+position+'" data-end="'+ end +'">'+tag+'</span>'
  });
  
  message = message.replace(/(\d\d)\:(\d\d)\:(\d\d)/gm, function (match, hrs, min, sec) {
          var seconds = (parseInt(hrs) * 3600) + (parseInt(min) * 60) + parseInt(sec);
          return '<span class="timestamp" onclick="scrub('+seconds*1000+')"> ▶ '+seconds+' seconds in</span>';
        });
  message = message.replace(/(http.*?soundcloud\.com\/([a-z]+)\/([0-9]+))/im, "<button onclick='loadSoundcloud(this, \"$1\");return false;'>Preview Soundcloud</button>")
  
  markdown += marked(message);
  
  var stats = {
    words: e.data.split(/\s/).length,
    chars: e.data.length,
    tags: tags.length
  }
  self.postMessage({markup:markdown, tags: tags, statistics: stats, index: index});
  
}, false);