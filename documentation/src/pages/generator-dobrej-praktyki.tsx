// src/pages/generator-dobrej-praktyki.tsx
import React, { useState, useEffect, ChangeEvent } from "react";
import Layout from "@theme/Layout";
import JSZip from "jszip";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useForm } from "react-hook-form";

const STORAGE_KEY = "dobraPraktykaForm";

export const initialForm = {
  title: "",
  opis: "",
  podmiot: "",
  zglaszajacy: "",
  wymiar: "",
  kontakt: "",
  problem: "",
  cele: "",
  dzialania: "",
  rezultaty: "",
};

export type FormValues = typeof initialForm;

function generateId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function generateMdx(form: FormValues, files: File[]) {
  const id = generateId(form.title || "dobra-praktyka");
  return `---
id: ${id}
title: ${form.title}
description: Krótki opis dobrej praktyki
sidebar_label: ${form.title}
sidebar_position: 999
opracowanie: ${form.zglaszajacy}
---

# Dobra praktyka: ${form.title}

## Metryczka
- **Podmiot realizujący:** ${form.podmiot}
- **Zgłaszający:** ${form.zglaszajacy}
- **Wymiar:** ${form.wymiar}
- **Kontakt:** ${form.kontakt}

## Krótki opis
${form.opis}

## Problem
${form.problem}

## Cele
${form.cele}

## Jak wdrożono praktykę
${form.dzialania}

## Rezultaty
${form.rezultaty}

## Załączniki
${files.length ? files.map((f) => "- " + f.name).join("\n") : "_Brak załączników._"}
`;
}

type Errors = { [key: string]: string };

export default function GeneratorDobrejPraktyki() {
  const [files, setFiles] = useState<File[]>([]);
  const [mdx, setMdx] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({});

  const form = useForm<FormValues>({
    defaultValues: initialForm,
  });

  // Load from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        form.reset({ ...initialForm, ...JSON.parse(saved) });
      } catch {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const subscription = form.watch((values) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Generate MDX preview
  useEffect(() => {
    setMdx(generateMdx(form.getValues(), files));
  }, [form.watch(), files]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const accepted = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip",
      "application/x-zip-compressed",
    ];

    const newErrors: Errors = {};
    const newFiles: File[] = [];

    selected.forEach((file) => {
      if (!accepted.includes(file.type)) {
        newErrors[`file:${file.name}`] = "Dozwolone formaty: PDF, DOCX, ZIP.";
      } else if (file.size > 5 * 1024 * 1024) {
        newErrors[`file:${file.name}`] = "Maksymalny rozmiar to 5 MB.";
      } else {
        newFiles.push(file);
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
    setFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[`file:${name}`];
      return copy;
    });
  };

  const handleExportZip = async () => {
    const values = form.getValues();
    const newErrors: Errors = {};
    if (!values.title.trim()) newErrors.title = "Tytuł jest wymagany.";
    if (!values.podmiot.trim()) newErrors.podmiot = "Podmiot jest wymagany.";
    if (!values.zglaszajacy.trim()) newErrors.zglaszajacy = "Zgłaszający jest wymagany.";
    if (!values.wymiar.trim()) newErrors.wymiar = "Wymiar dostępności jest wymagany.";

    const opisLen = values.opis.trim().length;
    if (opisLen < 500 || opisLen > 1500)
      newErrors.opis = "Opis musi mieć od 500 do 1500 znaków.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Proszę poprawić błędy przed eksportem.");
      return;
    }

    const id = generateId(values.title);
    const zip = new JSZip();
    zip.file(`${id}.mdx`, generateMdx(values, files));
    files.forEach((file) => zip.file(file.name, file));

    const content = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(content);
    a.download = `${id}.zip`;
    a.click();
  };

  const opisLength = form.watch("opis").trim();
  const opisValid = opisLength.length >= 500 && opisLength.length <= 1500;

  return (
    <Layout
      title="Generator opisu dobrej praktyki"
      description="Generator MDX dla opisów dobrych praktyk w Sieci Dostępności Cyfrowej"
    >
      <div className="tw">
        <div className="tw-content max-w-5xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold text-[#003366]">
            Generator opisu dobrej praktyki (MDX)
          </h1>

          <p className="text-sm text-gray-700">
            Uzupełnij formularz. Na końcu pobierzesz ZIP z plikiem MDX i załącznikami.
          </p>

          <Card>
            <CardContent className="p-4 space-y-4">
              <Form {...form}>
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={(e) => e.preventDefault()}>
                  {/* Lewa kolumna */}
                  <div className="space-y-4">
                    <FormField<FormValues>
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tytuł*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Krótka nazwa dobrej praktyki" />
                          </FormControl>
                          <FormMessage>{errors.title}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField<FormValues>
                      control={form.control}
                      name="podmiot"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Podmiot realizujący*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nazwa instytucji" />
                          </FormControl>
                          <FormMessage>{errors.podmiot}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField<FormValues>
                      control={form.control}
                      name="zglaszajacy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zgłaszający*</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Imię i nazwisko" />
                          </FormControl>
                          <FormMessage>{errors.zglaszajacy}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField<FormValues>
                      control={form.control}
                      name="wymiar"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Wymiar dostępności cyfrowej*</FormLabel>
                          <FormControl>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="-- wybierz wymiar --" />
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "Komunikacja",
                                  "Wiedza i umiejętności",
                                  "Wsparcie",
                                  "Cykl życia TIK",
                                  "Pracownicy",
                                  "Zaopatrzenie",
                                  "Zarządzanie i kultura",
                                ].map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage>{errors.wymiar}</FormMessage>
                        </FormItem>
                      )}
                    />
                    <FormField<FormValues>
                      control={form.control}
                      name="kontakt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dane kontaktowe</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Adres e-mail lub numer telefonu" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Prawa kolumna */}
                  <div className="space-y-4">
                    <FormField<FormValues>
                      control={form.control}
                      name="opis"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Krótki opis (500–1500 znaków)*</FormLabel>
                          <FormControl>
                            <Textarea {...field} rows={6} maxLength={1500} />
                          </FormControl>
                          <div className="flex justify-between text-sm">
                            <span className={opisValid ? "text-green-600" : "text-red-600"}>
                              {opisLength.length}/1500
                            </span>
                            {errors.opis && <span className="text-red-600">{errors.opis}</span>}
                          </div>
                        </FormItem>
                      )}
                    />
                    {["problem", "cele", "dzialania", "rezultaty"].map((name) => (
                      <FormField<FormValues>
                        key={name}
                        control={form.control}
                        name={name as keyof FormValues}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{name.charAt(0).toUpperCase() + name.slice(1)}</FormLabel>
                            <FormControl>
                              <Textarea {...field} rows={3} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </form>
              </Form>

              {/* Załączniki */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Załączniki (PDF, DOCX, ZIP)</label>
                <Input type="file" multiple onChange={handleFileChange} />
                {Object.entries(errors)
                  .filter(([k]) => k.startsWith("file:"))
                  .map(([k, m]) => (
                    <p key={k} className="text-red-600 text-sm">{m}</p>
                  ))}
                {files.length > 0 && (
                  <ul className="text-sm">
                    {files.map((f) => (
                      <li key={f.name} className="flex justify-between">
                        {f.name}
                        <button
                          type="button"
                          className="text-red-600 text-xs underline"
                          onClick={() => removeFile(f.name)}
                        >
                          Usuń
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button onClick={handleExportZip}>Pobierz ZIP (MDX + załączniki)</Button>
            </CardContent>
          </Card>

          {/* Podgląd MDX */}
          <Card>
            <CardContent>
              <h2 className="text-xl font-semibold">Podgląd MDX</h2>
              <pre className="whitespace-pre-wrap">{mdx}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
