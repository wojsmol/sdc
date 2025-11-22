import React, { useState } from "react";
import Layout from "@theme/Layout";
import JSZip from "jszip";
import mammoth from "mammoth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import "./tw/tw-tailwind.css";

interface MetaForm {
  title: string;
  description: string;
  sidebar_label: string;
  sidebar_position: string;
  keywords: string;
  opracowanie: string;
}

interface OptionsForm {
  cleanupEmptyLines: boolean;
  normalizeHeadings: boolean;
}

const initialMeta: MetaForm = {
  title: "",
  description: "",
  sidebar_label: "",
  sidebar_position: "999",
  keywords: "",
  opracowanie: "",
};

const initialOptions: OptionsForm = {
  cleanupEmptyLines: true,
  normalizeHeadings: true,
};

export default function GeneratorDocxMarkdown() {
  const [meta, setMeta] = useState<MetaForm>(initialMeta);
  const [options, setOptions] = useState<OptionsForm>(initialOptions);
  const [originalMarkdown, setOriginalMarkdown] = useState<string>("");
  const [markdown, setMarkdown] = useState<string>("");
  const [filenameBase, setFilenameBase] = useState<string>("converted");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const generateIdFromTitle = (title: string) =>
    (title || "dokument")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const splitKeywords = (text: string) =>
    text.split(/\r?\n/).map((k) => k.trim()).filter(Boolean);

  const applyMarkdownCleanup = (input: string, opts: OptionsForm) => {
    let md = input || "";
    if (opts.cleanupEmptyLines) md = md.replace(/\n{3,}/g, "\n\n");
    if (opts.normalizeHeadings) {
      md = md.replace(/^###\s+/gm, "## ").replace(/^##\s+/gm, "# ");
    }
    return md;
  };

  const handleDocxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base = file.name.replace(/\.docx$/i, "") || "converted";
    setFilenameBase(base);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToMarkdown({ arrayBuffer });
      const raw = result.value || "";
      setOriginalMarkdown(raw);
      const cleaned = applyMarkdownCleanup(raw, options);
      setMarkdown(cleaned);

      if (!meta.title)
        setMeta((prev) => ({
          ...prev,
          title: base,
          sidebar_label: prev.sidebar_label || base,
        }));
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, upload: "Nie udało się przetworzyć DOCX" }));
    }
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setMeta((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setOptions((prev) => ({ ...prev, [e.target.name]: e.target.checked }));

  const handleApplyOptions = () =>
    setMarkdown(applyMarkdownCleanup(markdown || originalMarkdown, options));

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!meta.title.trim()) newErrors.title = "Tytuł jest wymagany.";
    if (!meta.description.trim()) newErrors.description = "Opis jest wymagany.";
    if (!meta.sidebar_label.trim()) newErrors.sidebar_label = "Etykieta w menu jest wymagana.";
    if (!markdown.trim()) newErrors.markdown = "Brak treści Markdown.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildMarkdownFile = () => {
    const id = generateIdFromTitle(meta.title);
    const keywordsArray = splitKeywords(meta.keywords);
    const frontmatter = [
      "---",
      `id: ${id}`,
      `title: ${meta.title}`,
      `description: ${meta.description}`,
      `sidebar_label: ${meta.sidebar_label}`,
      `sidebar_position: ${meta.sidebar_position || "999"}`,
      "keywords:",
      ...(keywordsArray.length ? keywordsArray.map((k) => `  - ${k}`) : ["  - dostępność cyfrowa"]),
      `opracowanie: ${meta.opracowanie || ""}`,
      "---",
      "",
    ].join("\n");
    return frontmatter + markdown;
  };

  const handleDownload = () => {
    if (!validate()) return alert("Uzupełnij wymagane pola.");
    const blob = new Blob([buildMarkdownFile()], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${generateIdFromTitle(meta.title) || filenameBase}.md`;
    a.click();
  };

  const handleDownloadZip = async () => {
    if (!validate()) return alert("Uzupełnij wymagane pola.");
    const zip = new JSZip();
    zip.file(`${generateIdFromTitle(meta.title) || filenameBase}.md`, buildMarkdownFile());
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${generateIdFromTitle(meta.title) || filenameBase}.zip`;
    a.click();
  };

  return (
    <Layout title="Generator DOCX na Markdown" description="Generator DOCX na Markdown">
      <div className="tw">
        <div className="tw-content max-w-5xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold text-[#003366]">Generator Markdown z DOCX</h1>
          <p className="text-sm text-gray-700">
            Prześlij DOCX, uzupełnij metadane i pobierz plik Markdown lub ZIP.
          </p>

          <Card>
            <CardContent className="space-y-6 grid md:grid-cols-2 gap-6">
              {/* LEWA KOLUMNA */}
              <div className="space-y-4">
                <div>
                  <Label>Plik DOCX</Label>
                  <Input type="file" accept=".docx" onChange={handleDocxUpload} />
                  {errors.upload && <p className="text-xs text-red-600">{errors.upload}</p>}
                </div>

                <div>
                  <Label>Tytuł (title) *</Label>
                  <Input name="title" value={meta.title} onChange={handleMetaChange} />
                  {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <Label>Opis (description) *</Label>
                  <Textarea name="description" value={meta.description} onChange={handleMetaChange} rows={3} />
                  {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                </div>

                <div>
                  <Label>Sidebar label *</Label>
                  <Input name="sidebar_label" value={meta.sidebar_label} onChange={handleMetaChange} />
                  {errors.sidebar_label && <p className="text-xs text-red-600">{errors.sidebar_label}</p>}
                </div>

                <div>
                  <Label>Sidebar position</Label>
                  <Input type="number" name="sidebar_position" value={meta.sidebar_position} onChange={handleMetaChange} />
                </div>

                <div>
                  <Label>Słowa kluczowe</Label>
                  <Textarea name="keywords" value={meta.keywords} onChange={handleMetaChange} rows={3} placeholder="Jedno słowo na linię" />
                </div>

                <div>
                  <Label>Opracowanie</Label>
                  <Input name="opracowanie" value={meta.opracowanie} onChange={handleMetaChange} />
                </div>

                <div>
                  <Label>Opcje Markdown</Label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="cleanupEmptyLines" checked={options.cleanupEmptyLines} onChange={handleOptionChange} />
                    Usuń nadmiarowe puste linie
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="normalizeHeadings" checked={options.normalizeHeadings} onChange={handleOptionChange} />
                    Ujednolić nagłówki
                  </label>
                  <Button type="button" onClick={handleApplyOptions} className="mt-2">Zastosuj opcje</Button>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <Button type="button" onClick={handleDownload}>Pobierz Markdown</Button>
                  <Button type="button" variant="outline" onClick={handleDownloadZip}>Pobierz ZIP</Button>
                </div>
              </div>

              {/* PRAWA KOLUMNA */}
              <div className="space-y-2">
                <Label>Edytor Markdown</Label>
                <Textarea value={markdown} onChange={(e) => setMarkdown(e.target.value)} rows={20} className="font-mono text-sm" />
                {errors.markdown && <p className="text-xs text-red-600">{errors.markdown}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Podgląd pliku */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="text-xl font-semibold">Podgląd pliku</h2>
              <pre className="bg-gray-100 p-4 rounded border text-xs whitespace-pre-wrap overflow-x-auto">
                {buildMarkdownFile()}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
