<?php
include("config.php");
error_reporting(~E_ALL & ~E_NOTICE & ~E_DEPRECATED);

$ONE_HOUR_DELAY = 3600;
$DATE_FORMAT = 'd/m/Y H:i:s';

$url = "https://sheets.googleapis.com/v4/spreadsheets/{$SPREADSHEETS}/values/{$TABLE}?key={$API_KEY}";
$data = json_decode(file_get_contents($url), true);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin : *');

$shows = array();

foreach ($data["values"] as $key => $show) {
    if ($key == 0) {
        continue;
    }
    $current = array();
    $current["id"] = $key;
    $current["name"] = $show[0];
    $current["date"] = $show[1];
    $current["description"] = $show[2];
    $current["shortDescription"] = $show[3];
    $current["freeForStudents"] = strcasecmp($show[6], "OUI") == 0;
    $current["location"] = $show[7];
    $current["imgLink"] = $show[8];
    $current["logoLink"] = $show[9];
    $current["bannerImgLink"] = $show[10];
    $current["reservationLink"] = $show[11];
    $current["facebookLink"] = $show[12];
    $current["instagramLink"] = $show[13];
    $current["isPublished"] = strcasecmp($show[14], "OUI") == 0;
    $current["isHighlighted"] = strcasecmp($show[15], "OUI") == 0;
    $current["candidacyLink"] = $show[16];

    if (
        $current["isPublished"]
        and !empty($current["name"])
        and !empty($current["date"])
        and !empty($current["location"])
    ) {
        $current["date"] = DateTime::createFromFormat($DATE_FORMAT, $show[1])->getTimestamp();
        if ($current["date"] + $ONE_HOUR_DELAY < time()) {
            continue;
        }
        $current["price"] = intval($show[4]);
        $current["reducedPrice"] = intval($show[5]);
        $shows[] = $current;
    }
}

usort($shows, function ($a, $b) {
    $result = ($a['date'] <  $b['date']) ? -1 : 1;
    return $result;
});

echo json_encode($shows, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
