import React, { useState, useEffect } from "react";
import Layout from "@theme/Layout";
import JSZip from "jszip";
import mammoth from "mammoth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function GeneratorDocxMarkdown() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sidebarLabel, setSidebarLabel] = useState("");
  const [keywords, setKeywords] = useState("");
  const [opracowanie, setOpracowanie] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [originalMarkdown, setOriginalMarkdown] = useState("");
  const [filenameBase, setFilenameBase] = useState("converted");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [cleanupEmptyLines, setCleanupEmptyLines] = useState(true);
  const [normalizeHeadings, setNormalizeHeadings] = useState(true);

  const generateId = (text: string) =>
    (text || "dokument")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const splitKeywords = (text: string) =>
    text
      .split(/\r?\n/)
      .map((k) => k.trim())
      .filter(Boolean);

  const applyMarkdownCleanup = (md: string) => {
    let result = md;
    if (cleanupEmptyLines) result = result.replace(/\n{3,}/g, "\n\n");
    if (normalizeHeadings) {
      result = result.replace(/^###\s+/gm, "## ");
      result = result.replace(/^##\s+/gm, "# ");
    }
    return result;
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
      setMarkdown(applyMarkdownCleanup(raw));

      if (!title) setTitle(base);
      if (!sidebarLabel) setSidebarLabel(base);
    } catch (err) {
      console.error(err);
      setErrors({ upload: "Nie udało się przetworzyć pliku DOCX." });
    }
  };

  const handleDownload = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Tytuł jest wymagany.";
    if (!description.trim()) newErrors.description = "Opis jest wymagany.";
    if (!sidebarLabel.trim())
      newErrors.sidebarLabel = "Etykieta w menu jest wymagana.";
    if (!markdown.trim()) newErrors.markdown = "Brak treści Markdown.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      alert("Popraw błędy przed pobraniem.");
      return;
    }

    const id = generateId(title);
    const kw = splitKeywords(keywords);
    const frontmatter = [
      "---",
      `id: ${id}`,
      `title: ${title}`,
      `description: ${description}`,
      `sidebar_label: ${sidebarLabel}`,
      "keywords:",
      ...(kw.length ? kw.map((k) => `  - ${k}`) : ["  - dostępność cyfrowa"]),
      `opracowanie: ${opracowanie}`,
      "---",
      "",
    ].join("\n");

    const blob = new Blob([frontmatter + markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${id || filenameBase}.md`;
    a.click();
  };

  const handleDownloadZip = async () => {
    const id = generateId(title);
    const kw = splitKeywords(keywords);
    const frontmatter = [
      "---",
      `id: ${id}`,
      `title: ${title}`,
      `description: ${description}`,
      `sidebar_label: ${sidebarLabel}`,
      "keywords:",
      ...(kw.length ? kw.map((k) => `  - ${k}`) : ["  - dostępność cyfrowa"]),
      `opracowanie: ${opracowanie}`,
      "---",
      "",
    ].join("\n");

    const zip = new JSZip();
    zip.file(`${id || filenameBase}.md`, frontmatter + markdown);
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${id || filenameBase}.zip`;
    a.click();
  };

  return (
    <Layout
      title="Generator DOCX → Markdown"
      description="Generator Markdown z DOCX dla Sieci Dostępności Cyfrowej"
    >
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[#003366]">
          Generator Markdown z pliku DOCX
        </h1>
        <p className="text-sm text-gray-700">
          Prześlij plik DOCX, uzupełnij metadane i pobierz gotowy plik Markdown.
        </p>

        <Card>
          <CardContent className="p-6 space-y-6 grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Tytuł *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
              </div>

              <div>
                <Label>Opis *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm">{errors.description}</p>
                )}
              </div>

              <div>
                <Label>Etykieta w menu *</Label>
                <Input
                  value={sidebarLabel}
                  onChange={(e) => setSidebarLabel(e.target.value)}
                />
                {errors.sidebarLabel && (
                  <p className="text-red-600 text-sm">{errors.sidebarLabel}</p>
                )}
              </div>

              <div>
                <Label>Słowa kluczowe</Label>
                <Textarea
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={3}
                  placeholder="Wpisz po jednym słowie / frazie w każdej linii"
                />
              </div>

              <div>
                <Label>Opracowanie</Label>
                <Input
                  value={opracowanie}
                  onChange={(e) => setOpracowanie(e.target.value)}
                />
              </div>

              <div>
                <Label>Plik DOCX</Label>
                <Input type="file" accept=".docx" onChange={handleDocxUpload} />
                {errors.upload && <p className="text-red-600 text-sm">{errors.upload}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={cleanupEmptyLines}
                    onChange={(e) => setCleanupEmptyLines(e.target.checked)}
                  />
                  Usuń nadmiarowe puste linie
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={normalizeHeadings}
                    onChange={(e) => setNormalizeHeadings(e.target.checked)}
                  />
                  Ujednolić poziomy nagłówków
                </label>
                <Button type="button" onClick={() => setMarkdown(applyMarkdownCleanup(originalMarkdown))}>
                  Zastosuj opcje
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleDownload}>
                  Pobierz Markdown (.md)
                </Button>
                <Button type="button" variant="outline" onClick={handleDownloadZip}>
                  Pobierz ZIP (.md + archiwum)
                </Button>
              </div>
            </div>

            <div>
              <Label>Edytor Markdown</Label>
              <Textarea
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                rows={20}
                className="font-mono"
              />
              {errors.markdown && <p className="text-red-600 text-sm">{errors.markdown}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold">Podgląd pliku</h2>
            <pre className="bg-gray-100 p-4 rounded border text-xs whitespace-pre-wrap overflow-x-auto">
              {(() => {
                const id = generateId(title || filenameBase);
                const kw = splitKeywords(keywords);
                const frontmatter = [
                  "---",
                  `id: ${id}`,
                  `title: ${title}`,
                  `description: ${description}`,
                  `sidebar_label: ${sidebarLabel}`,
                  "keywords:",
                  ...(kw.length ? kw.map((k) => `  - ${k}`) : ["  - dostępność cyfrowa"]),
                  `opracowanie: ${opracowanie}`,
                  "---",
                  "",
                ].join("\n");
                return frontmatter + markdown;
              })()}
            </pre>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
