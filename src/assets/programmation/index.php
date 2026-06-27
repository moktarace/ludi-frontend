<?php
error_reporting(~E_ALL & ~E_NOTICE & ~E_DEPRECATED);

$ONE_HOUR_DELAY = 3600;

if (file_exists(__DIR__ . "/config.php")) {
    include(__DIR__ . "/config.php");
}

$DATA_FILE = $GESTION_DATES_DATA_FILE ?? ($PROGRAMMATION_DATA_FILE ?? (__DIR__ . "/data.json"));

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
        "imgLink" => trim((string)($show["imgLink"] ?? "")),
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

function json_response($payload): void
{
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}
