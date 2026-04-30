// Lightweight i18n — no library, just a typed string map.
// Auto-detects from navigator.language, persists override in localStorage.
// Add a new language by adding a new key to STRINGS.

import { useEffect, useState } from "react";

export type Lang =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "pt"
  | "ja"
  | "zh"
  | "ar"
  | "hi"
  | "ru";

export const LANGS: { code: Lang; label: string; flag: string; rtl?: boolean }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ar", label: "العربية", flag: "🇸🇦", rtl: true },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];

export type StringKey =
  | "brandTagline"
  | "play"
  | "editScene"
  | "headline"
  | "title"
  | "subtitle"
  | "emoji"
  | "accent"
  | "background"
  | "heading"
  | "bullets"
  | "addBullet"
  | "removeBullet"
  | "quote"
  | "author"
  | "url"
  | "copyJson"
  | "exportToMP4"
  | "exportTitle"
  | "exportBlurb"
  | "downloadProps"
  | "copyCommand"
  | "close"
  | "aiPlaceholder"
  | "aiButton"
  | "language";

export const STRINGS: Record<Lang, Record<StringKey, string>> = {
  en: {
    brandTagline: "Technologies AI",
    play: "Play / Pause",
    editScene: "Edit",
    headline: "Headline",
    title: "Title",
    subtitle: "Subtitle",
    emoji: "Emoji",
    accent: "Accent",
    background: "Background",
    heading: "Heading",
    bullets: "Bullets",
    addBullet: "+ Add bullet",
    removeBullet: "Remove bullet",
    quote: "Quote",
    author: "Author",
    url: "URL",
    copyJson: "Copy JSON",
    exportToMP4: "Export to MP4",
    exportTitle: "Export to MP4",
    exportBlurb:
      "Save your settings, then run the command in a terminal at the project root. The MP4 lands in out/.",
    downloadProps: "⬇ Download props.json",
    copyCommand: "Copy command",
    close: "Close",
    aiPlaceholder: "Tell me what your video is about…",
    aiButton: "Fill",
    language: "Language",
  },
  es: {
    brandTagline: "Technologies AI",
    play: "Reproducir / Pausar",
    editScene: "Editar",
    headline: "Titular",
    title: "Título",
    subtitle: "Subtítulo",
    emoji: "Emoji",
    accent: "Acento",
    background: "Fondo",
    heading: "Encabezado",
    bullets: "Puntos",
    addBullet: "+ Añadir punto",
    removeBullet: "Quitar",
    quote: "Cita",
    author: "Autor",
    url: "URL",
    copyJson: "Copiar JSON",
    exportToMP4: "Exportar a MP4",
    exportTitle: "Exportar a MP4",
    exportBlurb:
      "Guarda tus ajustes, luego ejecuta el comando en una terminal en la raíz del proyecto. El MP4 aparece en out/.",
    downloadProps: "⬇ Descargar props.json",
    copyCommand: "Copiar comando",
    close: "Cerrar",
    aiPlaceholder: "Dime de qué trata tu video…",
    aiButton: "Rellenar",
    language: "Idioma",
  },
  fr: {
    brandTagline: "Technologies AI",
    play: "Lecture / Pause",
    editScene: "Modifier",
    headline: "Titre",
    title: "Titre",
    subtitle: "Sous-titre",
    emoji: "Emoji",
    accent: "Accent",
    background: "Fond",
    heading: "En-tête",
    bullets: "Points",
    addBullet: "+ Ajouter un point",
    removeBullet: "Supprimer",
    quote: "Citation",
    author: "Auteur",
    url: "URL",
    copyJson: "Copier JSON",
    exportToMP4: "Exporter en MP4",
    exportTitle: "Exporter en MP4",
    exportBlurb:
      "Enregistrez vos paramètres, puis exécutez la commande dans un terminal à la racine du projet. Le MP4 apparaît dans out/.",
    downloadProps: "⬇ Télécharger props.json",
    copyCommand: "Copier la commande",
    close: "Fermer",
    aiPlaceholder: "Décrivez votre vidéo…",
    aiButton: "Remplir",
    language: "Langue",
  },
  de: {
    brandTagline: "Technologies AI",
    play: "Wiedergabe / Pause",
    editScene: "Bearbeiten",
    headline: "Überschrift",
    title: "Titel",
    subtitle: "Untertitel",
    emoji: "Emoji",
    accent: "Akzent",
    background: "Hintergrund",
    heading: "Überschrift",
    bullets: "Punkte",
    addBullet: "+ Punkt hinzufügen",
    removeBullet: "Entfernen",
    quote: "Zitat",
    author: "Autor",
    url: "URL",
    copyJson: "JSON kopieren",
    exportToMP4: "Als MP4 exportieren",
    exportTitle: "Als MP4 exportieren",
    exportBlurb:
      "Speichere die Einstellungen und führe den Befehl in einem Terminal im Projektverzeichnis aus. Die MP4 landet in out/.",
    downloadProps: "⬇ props.json herunterladen",
    copyCommand: "Befehl kopieren",
    close: "Schließen",
    aiPlaceholder: "Beschreibe dein Video…",
    aiButton: "Ausfüllen",
    language: "Sprache",
  },
  pt: {
    brandTagline: "Technologies AI",
    play: "Reproduzir / Pausar",
    editScene: "Editar",
    headline: "Título",
    title: "Título",
    subtitle: "Subtítulo",
    emoji: "Emoji",
    accent: "Acento",
    background: "Fundo",
    heading: "Cabeçalho",
    bullets: "Tópicos",
    addBullet: "+ Adicionar tópico",
    removeBullet: "Remover",
    quote: "Citação",
    author: "Autor",
    url: "URL",
    copyJson: "Copiar JSON",
    exportToMP4: "Exportar para MP4",
    exportTitle: "Exportar para MP4",
    exportBlurb:
      "Salve seus ajustes e rode o comando num terminal na raiz do projeto. O MP4 aparece em out/.",
    downloadProps: "⬇ Baixar props.json",
    copyCommand: "Copiar comando",
    close: "Fechar",
    aiPlaceholder: "Diga sobre o que é seu vídeo…",
    aiButton: "Preencher",
    language: "Idioma",
  },
  ja: {
    brandTagline: "Technologies AI",
    play: "再生 / 一時停止",
    editScene: "編集",
    headline: "見出し",
    title: "タイトル",
    subtitle: "サブタイトル",
    emoji: "絵文字",
    accent: "アクセント",
    background: "背景",
    heading: "ヘディング",
    bullets: "箇条書き",
    addBullet: "+ 項目を追加",
    removeBullet: "削除",
    quote: "引用",
    author: "著者",
    url: "URL",
    copyJson: "JSONをコピー",
    exportToMP4: "MP4にエクスポート",
    exportTitle: "MP4にエクスポート",
    exportBlurb:
      "設定を保存し、プロジェクトのルートで端末からコマンドを実行してください。MP4は out/ に出力されます。",
    downloadProps: "⬇ props.json をダウンロード",
    copyCommand: "コマンドをコピー",
    close: "閉じる",
    aiPlaceholder: "動画について教えてください…",
    aiButton: "入力",
    language: "言語",
  },
  zh: {
    brandTagline: "Technologies AI",
    play: "播放 / 暂停",
    editScene: "编辑",
    headline: "标题",
    title: "主标题",
    subtitle: "副标题",
    emoji: "表情",
    accent: "强调色",
    background: "背景",
    heading: "标题",
    bullets: "要点",
    addBullet: "+ 添加要点",
    removeBullet: "删除",
    quote: "引语",
    author: "作者",
    url: "网址",
    copyJson: "复制 JSON",
    exportToMP4: "导出为 MP4",
    exportTitle: "导出为 MP4",
    exportBlurb:
      "保存您的设置,然后在项目根目录的终端运行命令。MP4 会输出到 out/。",
    downloadProps: "⬇ 下载 props.json",
    copyCommand: "复制命令",
    close: "关闭",
    aiPlaceholder: "告诉我视频是关于什么的…",
    aiButton: "填充",
    language: "语言",
  },
  ar: {
    brandTagline: "Technologies AI",
    play: "تشغيل / إيقاف",
    editScene: "تعديل",
    headline: "العنوان",
    title: "العنوان",
    subtitle: "العنوان الفرعي",
    emoji: "إيموجي",
    accent: "اللون المميز",
    background: "الخلفية",
    heading: "الترويسة",
    bullets: "النقاط",
    addBullet: "+ إضافة نقطة",
    removeBullet: "حذف",
    quote: "اقتباس",
    author: "المؤلف",
    url: "الرابط",
    copyJson: "نسخ JSON",
    exportToMP4: "تصدير إلى MP4",
    exportTitle: "تصدير إلى MP4",
    exportBlurb:
      "احفظ إعداداتك ثم نفذ الأمر في طرفية بجذر المشروع. سيُنشأ ملف MP4 في out/.",
    downloadProps: "⬇ تنزيل props.json",
    copyCommand: "نسخ الأمر",
    close: "إغلاق",
    aiPlaceholder: "أخبرني عن موضوع الفيديو…",
    aiButton: "املأ",
    language: "اللغة",
  },
  hi: {
    brandTagline: "Technologies AI",
    play: "चलाएं / रोकें",
    editScene: "संपादित करें",
    headline: "शीर्षक",
    title: "शीर्षक",
    subtitle: "उपशीर्षक",
    emoji: "इमोजी",
    accent: "एक्सेंट",
    background: "पृष्ठभूमि",
    heading: "हेडिंग",
    bullets: "बिंदु",
    addBullet: "+ बिंदु जोड़ें",
    removeBullet: "हटाएं",
    quote: "उद्धरण",
    author: "लेखक",
    url: "URL",
    copyJson: "JSON कॉपी करें",
    exportToMP4: "MP4 में निर्यात करें",
    exportTitle: "MP4 में निर्यात करें",
    exportBlurb:
      "सेटिंग्स सहेजें, फिर प्रोजेक्ट रूट पर टर्मिनल में कमांड चलाएं। MP4 out/ में बनेगा।",
    downloadProps: "⬇ props.json डाउनलोड करें",
    copyCommand: "कमांड कॉपी करें",
    close: "बंद करें",
    aiPlaceholder: "अपना वीडियो किसके बारे में है बताएं…",
    aiButton: "भरें",
    language: "भाषा",
  },
  ru: {
    brandTagline: "Technologies AI",
    play: "Пуск / Пауза",
    editScene: "Изменить",
    headline: "Заголовок",
    title: "Заголовок",
    subtitle: "Подзаголовок",
    emoji: "Эмодзи",
    accent: "Акцент",
    background: "Фон",
    heading: "Заголовок",
    bullets: "Пункты",
    addBullet: "+ Добавить пункт",
    removeBullet: "Удалить",
    quote: "Цитата",
    author: "Автор",
    url: "URL",
    copyJson: "Копировать JSON",
    exportToMP4: "Экспорт в MP4",
    exportTitle: "Экспорт в MP4",
    exportBlurb:
      "Сохрани настройки и выполни команду в терминале в корне проекта. MP4 окажется в out/.",
    downloadProps: "⬇ Скачать props.json",
    copyCommand: "Скопировать команду",
    close: "Закрыть",
    aiPlaceholder: "Расскажи, о чём твоё видео…",
    aiButton: "Заполнить",
    language: "Язык",
  },
};

const STORAGE_KEY = "bbmw0.lang";

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && saved in STRINGS) return saved;
  } catch {
    // ignore (private mode etc)
  }
  const nav =
    typeof navigator !== "undefined" ? navigator.language || "en" : "en";
  const prefix = nav.toLowerCase().slice(0, 2) as Lang;
  if (prefix in STRINGS) return prefix;
  return "en";
}

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      const isRtl = LANGS.find((l) => l.code === lang)?.rtl ?? false;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    }
  }, [lang]);

  const setLang = (next: Lang) => setLangState(next);
  const t = (key: StringKey) => STRINGS[lang][key] ?? STRINGS.en[key];
  return { lang, setLang, t };
}
