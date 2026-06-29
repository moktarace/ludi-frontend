<?php
error_reporting(~E_ALL & ~E_NOTICE & ~E_DEPRECATED);

$ONE_HOUR_DELAY = 3600;

if (file_exists(__DIR__ . "/config.php")) {
    include(__DIR__ . "/config.php");
}

$DATA_FILE = $GESTION_DATES_DATA_FILE ?? ($PROGRAMMATION_DATA_FILE ?? (__DIR__ . "/data.json"));
$UPLOAD_DIR = $GESTION_DATES_UPLOAD_DIR ?? (__DIR__ . "/uploads");
$UPLOAD_URL = rtrim($GESTION_DATES_UPLOAD_URL ?? "assets/programmation/uploads", "/");
$KIT_LOGO_DIR = __DIR__ . "/../logo/kit";
$KIT_LOGO_URL = "assets/logo/kit";
$LEGACY_LOGO_DIR = $KIT_LOGO_DIR . "/legacy";
$LEGACY_LOGO_URL = $KIT_LOGO_URL . "/legacy";
$LEGACY_LOGO_LABELS = [
    "a-la-maniere-ludienne.png" => "À la manière ludienne",
    "avez-vous-deja-vu-un-spectacle-dimpro.png" => "Avez-vous déjà vu un spectacle d'impro",
    "championnat-etudiant-dimpro.png" => "Championnat étudiant d'impro",
    "comment-faire-peter-une-histoire-dans-la-minute.png" => "Comment faire péter une histoire dans la minute",
    "el-dia-del-muerto.png" => "El Día del Muerto",
    "face-a-face.png" => "Face à Face",
    "festival-de-la-ludi.png" => "Festival de la LUDI",
    "festival-de-si-si-ludi.png" => "Festival de si si LUDI",
    "impro-et-faits-divers.png" => "Impro & Faits Divers",
    "impro-football-club.png" => "Impro Football Club",
    "improv-on-the-corner.png" => "Improv on the Corner",
    "letrange-noel-de-la-ludi.png" => "L'étrange Noël de la LUDI",
    "limpro-fait-sa-rentree.png" => "L'impro fait sa rentrée",
    "la-crim-ne-paie-pas.png" => "La crim ne paie pas",
    "la-ludi-face-a-la-guilde-de-limprobable.png" => "La LUDI face à la Guilde de l'Improbable",
    "le-cercle-des-menteurs-fieffes.png" => "Le Cercle des menteurs fieffés",
    "le-dernier-festival-de-la-ludi-pour-linstant.png" => "Le dernier festival de la LUDI (pour l'instant)",
    "le-dernier-festival-de-la-ludi.png" => "Le dernier festival de la LUDI",
    "le-voyage-exquis.png" => "Le Voyage exquis",
    "les-inedits-de-la-ludi.png" => "Les Inédits de la LUDI",
    "les-ludiens-du-pere-noel.png" => "Les Ludiens du Père Noël",
    "les-pirates-du-midi.png" => "Les Pirates du Midi",
    "love-and-improv.png" => "Love & Improv",
    "maman-jai-rate-limpro.png" => "Maman, j'ai raté l'impro",
    "match-des-pioupioux.png" => "Match des Pioupioux",
    "match-dimpro.png" => "Match d'impro",
    "menu-maxi-best-of.png" => "Menu Maxi Best Of",
    "milla-palace-et-vincent-las-vegas.png" => "Milla Palace & Vincent Las Vegas",
    "objectif-liqa.png" => "Objectif LIQA",
    "objectif-ludi.png" => "Objectif LUDI",
    "old-school-vs-new-school.png" => "Old School vs New School",
    "question-pour-impro.png" => "Question pour Impro",
    "toulouse-suisse.png" => "Toulouse + Suisse",
    "voyage-au-centre-de-limpro.png" => "Voyage au centre de l'impro",
];

session_name("ludi_gestion_dates_admin");
session_start([
    "cookie_httponly" => true,
    "cookie_samesite" => "Strict",
    "cookie_secure" => !empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off",
]);

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: " . ($_SERVER["HTTP_ORIGIN"] ?? "*"));
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

$action = $_GET["action"] ?? "";

try {
    if ($action === "login") {
        handle_login($PROGRAMMATION_ADMIN_PASSWORD_HASH ?? "");
    } elseif ($action === "logout") {
        require_admin();
        $_SESSION = [];
        session_destroy();
        json_response(["ok" => true]);
    } elseif ($action === "session") {
        json_response([
            "authenticated" => is_admin(),
            "csrfToken" => $_SESSION["csrf_token"] ?? "",
        ]);
    } elseif ($action === "admin") {
        require_admin();
        if ($_SERVER["REQUEST_METHOD"] === "GET") {
            json_response(read_shows());
        }
        require_csrf();
        save_shows(read_json_body());
        json_response(read_shows());
    } elseif ($action === "media") {
        require_admin();
        json_response(media_library());
    } elseif ($action === "upload") {
        require_admin();
        require_csrf();
        json_response(upload_media(read_json_body()));
    } else {
        json_response(public_shows(read_shows(), $ONE_HOUR_DELAY));
    }
} catch (Throwable $error) {
    http_response_code($error->getCode() >= 400 ? $error->getCode() : 500);
    json_response(["error" => $error->getMessage()]);
}

function handle_login(string $password_hash): void
{
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        throw new RuntimeException("Méthode non autorisée", 405);
    }

    if (!$password_hash) {
        throw new RuntimeException("Gestion des dates non configurée", 503);
    }

    $body = read_json_body();
    $password = $body["password"] ?? "";
    if (!is_string($password) || !password_verify($password, $password_hash)) {
        throw new RuntimeException("Identifiants invalides", 401);
    }

    session_regenerate_id(true);
    $_SESSION["is_gestion_dates_admin"] = true;
    $_SESSION["csrf_token"] = bin2hex(random_bytes(32));
    json_response([
        "authenticated" => true,
        "csrfToken" => $_SESSION["csrf_token"],
    ]);
}

function require_admin(): void
{
    if (!is_admin()) {
        throw new RuntimeException("Authentification requise", 401);
    }
}

function require_csrf(): void
{
    $token = $_SERVER["HTTP_X_CSRF_TOKEN"] ?? "";
    if (!$token || !hash_equals($_SESSION["csrf_token"] ?? "", $token)) {
        throw new RuntimeException("Jeton CSRF invalide", 403);
    }
}

function is_admin(): bool
{
    return !empty($_SESSION["is_gestion_dates_admin"]);
}

function read_json_body(): array
{
    $raw = file_get_contents("php://input");
    $body = json_decode($raw ?: "{}", true);
    if (!is_array($body)) {
        throw new RuntimeException("JSON invalide", 400);
    }
    return $body;
}

function read_shows(): array
{
    global $DATA_FILE;
    if (!file_exists($DATA_FILE)) {
        return [];
    }

    $shows = json_decode(file_get_contents($DATA_FILE), true);
    if (!is_array($shows)) {
        throw new RuntimeException("Fichier des dates invalide", 500);
    }
    return $shows;
}

function save_shows(array $shows): void
{
    global $DATA_FILE;
    $normalized = array_map("normalize_show", $shows);
    usort($normalized, "compare_show_dates");
    $json = json_encode($normalized, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        throw new RuntimeException("Impossible de préparer les dates", 500);
    }

    if (file_put_contents($DATA_FILE, $json . PHP_EOL, LOCK_EX) === false) {
        throw new RuntimeException("Impossible d'enregistrer les dates", 500);
    }

    cleanup_unused_uploads($normalized);
}

function normalize_show(array $show): array
{
    return [
        "id" => normalize_id($show["id"] ?? null),
        "name" => trim((string)($show["name"] ?? "")),
        "date" => normalize_int($show["date"] ?? null),
        "description" => (string)($show["description"] ?? ""),
        "shortDescription" => (string)($show["shortDescription"] ?? ""),
        "price" => normalize_int($show["price"] ?? 0),
        "reducedPrice" => normalize_int($show["reducedPrice"] ?? 0),
        "freeForStudents" => !empty($show["freeForStudents"]),
        "location" => trim((string)($show["location"] ?? "")),
        "logoLink" => trim((string)($show["logoLink"] ?? "")),
        "reservationLink" => trim((string)($show["reservationLink"] ?? "")),
        "isPublished" => !empty($show["isPublished"]),
        "isHighlighted" => !empty($show["isHighlighted"]),
    ];
}

function normalize_id($id)
{
    if ($id === null || $id === "") {
        return uniqid("show-", true);
    }
    return is_numeric($id) ? intval($id) : (string)$id;
}

function normalize_int($value): int
{
    return $value === null || $value === "" ? 0 : intval($value);
}

function public_shows(array $shows, int $one_hour_delay): array
{
    $now = time();
    $public = array_filter(array_map("normalize_show", $shows), function ($show) use ($now, $one_hour_delay) {
        return !empty($show["isPublished"])
            && !empty($show["name"])
            && !empty($show["date"])
            && !empty($show["location"])
            && $show["date"] + $one_hour_delay >= $now;
    });
    usort($public, "compare_show_dates");
    return array_values($public);
}

function compare_show_dates(array $a, array $b): int
{
    return ($a["date"] ?? 0) <=> ($b["date"] ?? 0);
}

function media_library(): array
{
    return [
        "kitLogos" => list_media_files($GLOBALS["KIT_LOGO_DIR"], $GLOBALS["KIT_LOGO_URL"], "logo"),
        "legacyLogos" => list_media_files($GLOBALS["LEGACY_LOGO_DIR"], $GLOBALS["LEGACY_LOGO_URL"], "legacy"),
        "uploads" => list_media_files($GLOBALS["UPLOAD_DIR"], $GLOBALS["UPLOAD_URL"], "upload"),
    ];
}

function list_media_files(string $directory, string $base_url, string $kind): array
{
    if (!is_dir($directory)) {
        return [];
    }

    $items = [];
    foreach (scandir($directory) ?: [] as $file) {
        if ($file === "." || $file === ".." || !is_allowed_image_name($file)) {
            continue;
        }

        $items[] = [
            "label" => $kind === "legacy" ? ($GLOBALS["LEGACY_LOGO_LABELS"][$file] ?? media_label($file)) : media_label($file),
            "url" => $base_url . "/" . rawurlencode($file),
            "kind" => $kind,
        ];
    }

    usort($items, fn($a, $b) => strcmp($a["label"], $b["label"]));
    return $items;
}

function upload_media(array $body): array
{
    global $UPLOAD_DIR, $UPLOAD_URL;

    $file_name = sanitize_filename((string)($body["fileName"] ?? "image"));
    $mime_type = (string)($body["mimeType"] ?? "");
    $data_url = (string)($body["dataUrl"] ?? "");

    if (!in_array($mime_type, ["image/jpeg", "image/png"], true)) {
        throw new RuntimeException("Format refusé. Utilise une image JPEG ou PNG.", 400);
    }

    if (!preg_match("#^data:image/(jpeg|png);base64,#", $data_url)) {
        throw new RuntimeException("Image invalide", 400);
    }

    $binary = base64_decode(preg_replace("#^data:image/(jpeg|png);base64,#", "", $data_url), true);
    if ($binary === false || strlen($binary) > 8 * 1024 * 1024) {
        throw new RuntimeException("Image trop lourde", 400);
    }

    $info = @getimagesizefromstring($binary);
    if (!$info || !in_array($info["mime"] ?? "", ["image/jpeg", "image/png"], true)) {
        throw new RuntimeException("Image invalide", 400);
    }

    if (!is_dir($UPLOAD_DIR) && !mkdir($UPLOAD_DIR, 0775, true)) {
        throw new RuntimeException("Impossible de préparer le dossier d'upload", 500);
    }

    $extension = ($info["mime"] ?? "") === "image/png" ? "png" : "jpg";
    $target_name = pathinfo($file_name, PATHINFO_FILENAME) . "-" . date("Ymd-His") . "-" . bin2hex(random_bytes(4)) . "." . $extension;
    $target_path = $UPLOAD_DIR . "/" . $target_name;

    if (file_put_contents($target_path, $binary, LOCK_EX) === false) {
        throw new RuntimeException("Impossible d'enregistrer l'image", 500);
    }

    return [
        "label" => media_label($target_name),
        "url" => $UPLOAD_URL . "/" . rawurlencode($target_name),
        "kind" => "upload",
    ];
}

function cleanup_unused_uploads(array $shows): void
{
    global $UPLOAD_DIR, $UPLOAD_URL;
    if (!is_dir($UPLOAD_DIR)) {
        return;
    }

    $used = [];
    foreach ($shows as $show) {
        foreach (["logoLink"] as $field) {
            $value = (string)($show[$field] ?? "");
            if (strpos($value, $UPLOAD_URL . "/") === 0) {
                $used[basename(parse_url($value, PHP_URL_PATH) ?: "")] = true;
            }
        }
    }

    foreach (scandir($UPLOAD_DIR) ?: [] as $file) {
        if ($file === "." || $file === ".." || !is_allowed_image_name($file) || isset($used[$file])) {
            continue;
        }
        @unlink($UPLOAD_DIR . "/" . $file);
    }
}

function is_allowed_image_name(string $file): bool
{
    return (bool)preg_match("/\.(jpe?g|png)$/i", $file);
}

function sanitize_filename(string $file_name): string
{
    $base = strtolower(pathinfo($file_name, PATHINFO_FILENAME) ?: "image");
    $base = iconv("UTF-8", "ASCII//TRANSLIT//IGNORE", $base) ?: $base;
    $base = preg_replace("/[^a-z0-9]+/", "-", $base);
    return trim($base ?: "image", "-");
}

function media_label(string $file): string
{
    $label = preg_replace("/\.(jpe?g|png)$/i", "", $file);
    $label = preg_replace("/-\d{8}-\d{6}-[a-f0-9]{8}$/", "", $label);
    return ucfirst(str_replace("-", " ", $label));
}

function json_response($payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
