import { NextResponse } from "next/server";

// Tipe data untuk pertanyaan yang dihasilkan
type GeneratedQuestion = {
  question_text: string;
  answers: {
    answer_text: string;
    is_correct: boolean;
  }[];
};

// Tipe data untuk metadata quiz
type QuizMetadata = {
  title: string;
  description: string;
  category: string;
  language: string;
};

export async function POST(request: Request) {
  try {
    const { prompt, language, count = 5, generateMetadata = true } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Mendapatkan API key dari environment variable
    const apiKey = process.env.COHERE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key Cohere tidak ditemukan" },
        { status: 500 }
      );
    }

    // Format prompt untuk Cohere
    const systemPrompt = `Kamu adalah pembuat quiz profesional yang ahli dalam membuat pertanyaan quiz yang menarik dan edukatif.
Buatkan ${count} pertanyaan quiz dengan 4 pilihan jawaban untuk topik berikut: ${prompt}.

${generateMetadata ? `Juga buatkan metadata quiz dengan judul menarik, deskripsi singkat, dan kategori yang sesuai dengan topik.` : ''}

Bahasa: ${language === 'id' ? 'Indonesia' : 'Inggris'}

Format jawaban harus dalam JSON dengan struktur berikut:
{
  ${generateMetadata ? `"metadata": {
    "title": "Judul Quiz yang Menarik",
    "description": "Deskripsi singkat tentang quiz ini",
    "category": "general",
    "language": "${language}"
  },` : ''}
  "questions": [
    {
      "question_text": "Pertanyaan 1?",
      "answers": [
        { "answer_text": "Jawaban benar", "is_correct": true },
        { "answer_text": "Jawaban salah 1", "is_correct": false },
        { "answer_text": "Jawaban salah 2", "is_correct": false },
        { "answer_text": "Jawaban salah 3", "is_correct": false }
      ]
    },
    ...
  ]
}

Kategori yang tersedia adalah: general, science, math, history, geography, language, technology, sports, entertainment, business.

Pastikan hanya ada satu jawaban benar untuk setiap pertanyaan.
Jawaban harus masuk akal dan relevan dengan pertanyaan.
Jangan tambahkan informasi atau teks lain selain JSON yang diminta.`;

    // Panggil API Cohere
    const response = await fetch("https://api.cohere.ai/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Cohere-Version": "2022-12-06",
      },
      body: JSON.stringify({
        model: "command",
        prompt: systemPrompt,
        max_tokens: 2000,
        temperature: 0.7,
        stop_sequences: [],
        return_likelihoods: "NONE",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error dari Cohere API:", data);
      return NextResponse.json(
        { error: "Gagal menghasilkan pertanyaan" },
        { status: response.status }
      );
    }

    // Ekstrak JSON dari respons
    const generatedText = data.generations[0].text.trim();
    
    // Coba parse JSON dari respons
    let parsedData: { metadata?: QuizMetadata, questions: GeneratedQuestion[] };
    try {
      // Cari teks JSON dalam respons (dimulai dengan { dan diakhiri dengan })
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Format JSON tidak valid");
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      console.error("Teks yang diterima:", generatedText);
      return NextResponse.json(
        { error: "Format respons tidak valid" },
        { status: 500 }
      );
    }

    // Validasi metadata jika diminta
    let metadata = undefined;
    if (generateMetadata && parsedData.metadata) {
      metadata = {
        title: parsedData.metadata.title || "",
        description: parsedData.metadata.description || "",
        category: parsedData.metadata.category || "general",
        language: parsedData.metadata.language || language,
      };
    }

    // Validasi struktur pertanyaan
    const questions = parsedData.questions || [];
    const validatedQuestions = questions
      .filter(q => 
        q.question_text && 
        Array.isArray(q.answers) && 
        q.answers.length >= 2 && 
        q.answers.some(a => a.is_correct)
      )
      .map(q => ({
        ...q,
        // Pastikan hanya ada satu jawaban benar
        answers: q.answers.slice(0, 4).map((a, i) => ({
          answer_text: a.answer_text,
          is_correct: i === q.answers.findIndex(ans => ans.is_correct),
        })),
      }));

    if (validatedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada pertanyaan valid yang dihasilkan" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      questions: validatedQuestions,
      metadata
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
} 