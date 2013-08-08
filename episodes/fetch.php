<?php
$files = glob("*.md");

rsort($files);
echo '<select>';
foreach ($files as $filename) {
    echo "<option value='episodes/{$filename}'>".preg_replace('/([0-9]{3})\-(.*)\.md/m', 'Show $1 $2',$filename)."</option>\n";
}
echo '</select>';
?>