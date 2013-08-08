<?php
  echo '<pre>';

$idx = isset($_GET['sheet']) ? $_GET['sheet'] : 1;
$file = realpath("../../../content/Sheet{$idx}.csv.json");

$content = json_decode(file_get_contents($file));


foreach ($content as $episode) {
  $file = trim(preg_replace('/[^0-9]/', '-', $episode->Show .'_' . $episode->Date), '-') . '.md';
  
  $output = '';

  // title (build)
  $output .= '# '.$episode->Show. ' ' .$episode->Date . "\n";
  
  // Description
  $output .= $episode->Description . "\n\n";
  
  // MainImage
  $output .= "![main image](". $episode->MainImage . ")\n\n";
  
  // Audio
  $output .= $episode->Audio ? "[Download Audio](". $episode->Audio . ")\n" : '';
  
  // Videos
  $output .= $episode->Videos ? $episode->Videos . "\n" : '';
  
  // Flickr
  $output .= $episode->FlickrPhotoSet ? $episode->FlickrPhotoSet . "\n" : '';
  
  // Guests
  if ($episode->Guests) {
    $output .= "\n## Guests\n";
    $output .= $episode->Guests  . "\n";
  }
  
  
  // PullQuote
  if ($episode->PullQuote) {
    $output .= '> ' . $episode->PullQuote;
  }
  
  // ShowNotes
  
  $output .= "\n## News\n";
  $output .= iconv('UTF-8', 'ASCII//TRANSLIT', $episode->ShowNotes)."\n";
  // Recurringsegments
  
  if ($episode->Recurringsegments) {
    $output .= "\n## Recurring Segments\n";
    $output .= "{$episode->Recurringsegments}\n";
  }
  
  // FeaturedSongs
  $conv = iconv('UTF-8', 'ASCII//TRANSLIT', $episode->FeaturedSongs);
  preg_match_all('/.*\n/m', $conv, $results);
      
  $output .= "\n## Featured Songs\n";
  foreach ($results[0] as $key => $value) {
    $output .= sprintf("%d. %s", ($key + 1), $value);
  }
  // print_r($output);
  echo "{$file}\n\n";
  file_put_contents($file, $output);
}


?>