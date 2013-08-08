<?php
error_reporting(E_ALL);
$data = $_POST;

if (! file_put_contents($data['file'], $data['text'], LOCK_EX)) {
  echo 'no save.';
} else {
  echo 'saved.';
}

?>