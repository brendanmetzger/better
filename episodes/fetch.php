<?php
$files = glob("*.md");

usort($files, function($a, $b) {
  $a = (int)preg_replace('/([0-9]{1,3})\-.*/i', '$1', $a);
  $b = (int)preg_replace('/([0-9]{1,3})\-.*/i', '$1', $b);
  if ($a == $b) {
    return 0;
  }
  return ($a < $b) ? 1 : -1;
});

echo "<select>\n";
$groups = array(
);
foreach ($files as $filename) {
  $key = substr($filename, -7, 4);
  if (!array_key_exists($key, $groups)) {
    $groups[$key] = array();
  }
  $option =  "<option value='episodes/{$filename}'>".preg_replace('/([0-9]{1,3})\-(.*)\.md/m', 'Show $1 $2',$filename)."</option>";
  $groups[$key][] = $option;
    
}


foreach ($groups as $key => $group) {
  echo "<optgroup label=\"{$key}\">\n";
    foreach ($group as $option) {
      echo $option . "\n";
    }
  echo "</optgroup>\n";
}
echo '</select>';

print_r($group);
?>