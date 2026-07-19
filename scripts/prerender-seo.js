const fs = require('fs')
const path = require('path')

const siteUrl = 'https://luditoulouse.org/'
const distIndexPath = path.resolve(__dirname, '../dist/ludi-frontend/index.html')
const distPhpIndexPath = path.resolve(__dirname, '../dist/ludi-frontend/index.php')
const distHtaccessPath = path.resolve(__dirname, '../dist/ludi-frontend/.htaccess')
const maxEvents = 10

function fallbackHtml() {
  return `
      <main>
        <h1>Impro Toulouse - LUDI Toulouse</h1>
        <p>
          La LUDI Toulouse est une troupe de théâtre d'improvisation à Toulouse.
          Depuis 1997, elle propose des spectacles d'impro, des matchs d'impro,
          des catchs, des cours d'essai et des rencontres avec des ligues venues
          de France et de l'étranger.
        </p>
        <section>
          <h2>Prochains spectacles d'impro à Toulouse</h2>
          <p>Les prochaines dates seront bientôt annoncées.</p>
        </section>
        <section>
          <h2>Cours, matchs et catchs d'impro</h2>
          <p>
            La LUDI joue à Toulouse, notamment autour de Paul Sabatier et du CAP,
            et accueille les personnes qui veulent découvrir l'improvisation
            théâtrale en début de saison.
          </p>
        </section>
      </main>
    `
}

function injectFallback(html) {
  return html.replace(/<app-root>[\s\S]*?<\/app-root>/, `<app-root>${fallbackHtml()}</app-root>`)
}

function phpRuntimeIndex() {
  return `<?php
declare(strict_types=1);

$siteUrl = 'https://luditoulouse.org/';
$maxEvents = ${maxEvents};

function ludi_read_shows(): array
{
    $dataPath = __DIR__ . '/assets/programmation/data.json';
    if (!is_file($dataPath)) {
        return [];
    }

    $content = file_get_contents($dataPath);
    if ($content === false) {
        return [];
    }

    $shows = json_decode($content, true);
    return is_array($shows) ? $shows : [];
}

function ludi_upcoming_shows(array $shows, int $maxEvents): array
{
    $now = time();
    $upcoming = array_values(array_filter($shows, static function ($show) use ($now) {
        return is_array($show)
            && ($show['isPublished'] ?? true) !== false
            && !empty($show['name'])
            && !empty($show['date'])
            && (int) $show['date'] >= $now;
    }));

    usort($upcoming, static function ($a, $b) {
        return ((int) ($a['date'] ?? 0)) <=> ((int) ($b['date'] ?? 0));
    });

    return array_slice($upcoming, 0, $maxEvents);
}

function ludi_absolute_url(?string $url, string $siteUrl): ?string
{
    if (!$url) {
        return null;
    }

    if (preg_match('/^https?:\\/\\//', $url)) {
        return $url;
    }

    return $siteUrl . ltrim($url, '/');
}

function ludi_event_description(array $show): string
{
    $description = trim((string) ($show['shortDescription'] ?? $show['description'] ?? ''));
    return $description !== '' ? $description : "Spectacle de théâtre d'improvisation à Toulouse avec la LUDI.";
}

function ludi_event_offer(array $show, string $siteUrl): array
{
    return [
        '@type' => 'Offer',
        'url' => $show['reservationLink'] ?? $siteUrl,
        'price' => is_numeric($show['price'] ?? null) ? (float) $show['price'] : 0,
        'priceCurrency' => 'EUR',
        'availability' => 'https://schema.org/InStock',
        'validFrom' => date(DATE_ATOM),
    ];
}

function ludi_show_to_event(array $show, string $siteUrl): array
{
    $id = rawurlencode((string) ($show['id'] ?? $show['date'] ?? $show['name']));
    $event = [
        '@type' => 'Event',
        '@id' => $siteUrl . '#event-' . $id,
        'name' => ((string) $show['name']) . ' - impro à Toulouse',
        'description' => ludi_event_description($show),
        'startDate' => date(DATE_ATOM, (int) $show['date']),
        'eventStatus' => 'https://schema.org/EventScheduled',
        'eventAttendanceMode' => 'https://schema.org/OfflineEventAttendanceMode',
        'url' => $show['reservationLink'] ?? $siteUrl,
        'location' => [
            '@type' => 'Place',
            'name' => $show['location'] ?? 'Toulouse',
            'address' => [
                '@type' => 'PostalAddress',
                'addressLocality' => 'Toulouse',
                'addressRegion' => 'Occitanie',
                'addressCountry' => 'FR',
            ],
        ],
        'organizer' => ['@id' => $siteUrl . '#ludi'],
        'performer' => ['@id' => $siteUrl . '#ludi'],
        'offers' => ludi_event_offer($show, $siteUrl),
    ];

    $image = ludi_absolute_url($show['logoLink'] ?? null, $siteUrl);
    if ($image) {
        $event['image'] = [$image];
    }

    return $event;
}

function ludi_price_label(array $show): string
{
    $price = $show['price'] ?? null;
    $reducedPrice = $show['reducedPrice'] ?? null;

    if ($price === 0 && $reducedPrice === 0) {
        return 'Entrée gratuite';
    }

    if (is_numeric($price) && is_numeric($reducedPrice)) {
        return $price . ' € / ' . $reducedPrice . ' €';
    }

    return is_numeric($price) ? $price . ' €' : '';
}

function ludi_fallback_html(array $shows): string
{
    $items = '';
    foreach (array_slice($shows, 0, 4) as $show) {
        $date = !empty($show['date'])
            ? (new DateTimeImmutable('@' . (int) $show['date']))->setTimezone(new DateTimeZone('Europe/Paris'))->format('d/m/Y H\\h i')
            : '';
        $items .= '<li><strong>' . htmlspecialchars((string) $show['name'], ENT_QUOTES, 'UTF-8') . '</strong>'
            . '<span>' . htmlspecialchars($date, ENT_QUOTES, 'UTF-8') . '</span>'
            . '<span>' . htmlspecialchars((string) ($show['location'] ?? 'Toulouse'), ENT_QUOTES, 'UTF-8') . '</span>'
            . '<span>' . htmlspecialchars(ludi_price_label($show), ENT_QUOTES, 'UTF-8') . '</span></li>';
    }

    if ($items === '') {
        $items = '<li>Les prochaines dates seront bientôt annoncées.</li>';
    }

    return '<main><h1>Impro Toulouse - LUDI Toulouse</h1>'
        . "<p>La LUDI Toulouse est une troupe de théâtre d'improvisation à Toulouse. Depuis 1997, elle propose des spectacles d'impro, des matchs d'impro, des catchs, des cours d'essai et des rencontres avec des ligues venues de France et de l'étranger.</p>"
        . "<section><h2>Prochains spectacles d'impro à Toulouse</h2><ul>" . $items . '</ul></section>'
        . "<section><h2>Cours, matchs et catchs d'impro</h2><p>La LUDI joue à Toulouse, notamment autour de Paul Sabatier et du CAP, et accueille les personnes qui veulent découvrir l'improvisation théâtrale en début de saison.</p></section>"
        . '</main>';
}

$shows = ludi_upcoming_shows(ludi_read_shows(), $maxEvents);
$html = file_get_contents(__DIR__ . '/index.html');

if ($html === false) {
    http_response_code(500);
    exit('index.html introuvable');
}

$events = array_map(static function ($show) use ($siteUrl) {
    return ludi_show_to_event($show, $siteUrl);
}, $shows);

$html = preg_replace('/\\s*<script id="ludi-events-json-ld" type="application\\/ld\\+json">[\\s\\S]*?<\\/script>/', '', $html);

if ($events) {
    $json = json_encode([
        '@context' => 'https://schema.org',
        '@graph' => $events,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $html = str_replace('</head>', '<script id="ludi-events-json-ld" type="application/ld+json">' . $json . '</script></head>', $html);
}

$html = preg_replace('/<app-root>[\\s\\S]*?<\\/app-root>/', '<app-root>' . ludi_fallback_html($shows) . '</app-root>', $html);

header('Content-Type: text/html; charset=UTF-8');
echo $html;
`
}

function htaccess() {
  return `DirectoryIndex index.php index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ index.php [L]
</IfModule>
`
}

function main() {
  if (!fs.existsSync(distIndexPath)) {
    throw new Error('SEO prerender: dist/ludi-frontend/index.html introuvable')
  }

  let html = fs.readFileSync(distIndexPath, 'utf8')
  html = html.replace(/\s*<script id="ludi-events-json-ld" type="application\/ld\+json">[\s\S]*?<\/script>/, '')
  html = injectFallback(html)
  fs.writeFileSync(distIndexPath, html)
  fs.writeFileSync(distPhpIndexPath, phpRuntimeIndex())
  fs.writeFileSync(distHtaccessPath, htaccess())
  console.log('SEO runtime: index.php généré pour lire les dates serveur')
}

main()
