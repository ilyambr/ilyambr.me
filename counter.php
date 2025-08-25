<?php
// Read current count
$file = "count.txt";
$count = (int)file_get_contents($file);

// Increase count by 1
$count++;

// Save new count
file_put_contents($file, $count);

// Split count into digits
$digits = str_split($count);

// Display the counter images
foreach ($digits as $digit) {
    echo '<img src="https://ilyambr.me/counter/' . $digit . '.gif">';
}
?>
