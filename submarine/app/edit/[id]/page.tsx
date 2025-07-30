"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Plus, Trash2, Clock, Trophy, Slack, Info, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import ImageUpload from "@/components/ui/image-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { QuizPageWithLoading } from "@/components/ui/page-with-loading"

const categories = [
  { value: "general", label: "Umum" },
  { value: "science", label: "Sains" },
  { value: "math", label: "Matematika" },
  { value: "history", label: "Sejarah" },
  { value: "geography", label: "Geografi" },
  { value: "language", label: "Bahasa" },
  { value: "technology", label: "Teknologi" },
  { value: "sports", label: "Olahraga" },
  { value: "entertainment", label: "Hiburan" },
  { value: "business", label: "Bisnis" },
];

const languages = [
  { value: "id", label: "Indonesia" },
  { value: "en", label: "Inggris" },
];

interface Answer {
  id: string
  text: string
  isCorrect: boolean
  color: string
  image_url?: string | null
}

interface Question {
  id: string
  text: string
  timeLimit: number
  points: number
  image_url?: string | null
  answers: Answer[]
}

interface Quiz {
  id: string
  title: string
  description: string | null
  category: string
  language: string
  is_public: boolean
  questions: Question[]
}

const answerColors = [
  "#e74c3c", // Red
  "#3498db", // Blue
  "#2ecc71", // Green
  "#f1c40f", // Yellow
]

function EditQuizPageContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  
  // Add confirmation dialog state
  const [showDeleteQuestionConfirm, setShowDeleteQuestionConfirm] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null)
  const [skipQuestionDeleteConfirmation, setSkipQuestionDeleteConfirmation] = useState(false)
  
  const [showDeleteAnswerConfirm, setShowDeleteAnswerConfirm] = useState(false)
  const [answerToDelete, setAnswerToDelete] = useState<{questionId: string, answerId: string} | null>(null)
  const [skipAnswerDeleteConfirmation, setSkipAnswerDeleteConfirmation] = useState(false)

  useEffect(() => {
    if (user) {
      fetchQuiz()
    }
  }, [user, resolvedParams.id])

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!user) {
      router.push("/")
    }
  }, [user, router])

  const fetchQuiz = async () => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select(`
          id,
          title,
          description,
          category,
          language,
          is_public,
          questions (
            id,
            question_text,
            time_limit,
            points,
            order_index,
            image_url,
            answers (
              id,
              answer_text,
              is_correct,
              color,
              order_index,
              image_url
            )
          )
        `)
        .eq("id", resolvedParams.id)
        .eq("creator_id", user?.id)
        .single()

      if (quizError) throw quizError

      // Transform data
      const transformedQuiz: Quiz = {
        id: quizData.id,
        title: quizData.title,
        description: quizData.description,
        category: quizData.category || "general",
        language: quizData.language || "id",
        is_public: quizData.is_public || false,
        questions: quizData.questions
          .sort((a, b) => a.order_index - b.order_index)
          .map((q) => ({
            id: q.id,
            text: q.question_text,
            timeLimit: q.time_limit,
            points: q.points,
            image_url: q.image_url,
            answers: q.answers
              .sort((a, b) => a.order_index - b.order_index)
              .map((a) => ({
                id: a.id,
                text: a.answer_text,
                isCorrect: a.is_correct,
                color: a.color,
                image_url: a.image_url,
              })),
          })),
      }

      setQuiz(transformedQuiz)
    } catch (error) {
      console.error("Error fetching quiz:", error)
      toast({
        title: "Error",
        description: "Gagal memuat quiz. Silakan coba lagi.",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const updateQuiz = (field: string, value: any) => {
    if (!quiz) return
    setQuiz({ ...quiz, [field]: value })
  }

  const updateQuestion = (questionId: string, field: string, value: any) => {
    if (!quiz) return
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
    })
  }

  const updateAnswer = (questionId: string, answerId: string, field: string, value: any) => {
    if (!quiz) return
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) => (a.id === answerId ? { ...a, [field]: value } : a)),
            }
          : q,
      ),
    })
  }

  const setCorrectAnswer = (questionId: string, answerId: string) => {
    if (!quiz) return
    setQuiz({
      ...quiz,
      questions: quiz.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.map((a) => ({ ...a, isCorrect: a.id === answerId })),
            }
          : q,
      ),
    })
  }

  const addQuestion = () => {
    if (!quiz) return

    const newQuestion: Question = {
      id: `new_${Date.now()}`,
      text: "",
      timeLimit: 20,
      points: 10,
      image_url: null,
      answers: [
        { id: `new_${Date.now()}_1`, text: "", isCorrect: true, color: answerColors[0], image_url: null },
        { id: `new_${Date.now()}_2`, text: "", isCorrect: false, color: answerColors[1], image_url: null },
        { id: `new_${Date.now()}_3`, text: "", isCorrect: false, color: answerColors[2], image_url: null },
        { id: `new_${Date.now()}_4`, text: "", isCorrect: false, color: answerColors[3], image_url: null },
      ],
    }

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion],
    })
  }

  const removeQuestion = async (questionId: string) => {
    if (!quiz || quiz.questions.length <= 1) return

    if (skipQuestionDeleteConfirmation) {
      // If skipping confirmation, delete immediately
      await deleteQuestion(questionId)
    } else {
      // Otherwise show confirmation dialog
      setQuestionToDelete(questionId)
      setShowDeleteQuestionConfirm(true)
    }
  }

  const confirmDeleteQuestion = async () => {
    if (questionToDelete) {
      await deleteQuestion(questionToDelete)
      setQuestionToDelete(null)
      setShowDeleteQuestionConfirm(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    // If it's an existing question, delete from database
    if (!questionId.startsWith("new_")) {
      try {
        const { error } = await supabase.from("questions").delete().eq("id", questionId)

        if (error) throw error
      } catch (error) {
        console.error("Error deleting question:", error)
        return
      }
    }

    setQuiz({
      ...quiz!,
      questions: quiz!.questions.filter((q) => q.id !== questionId),
    })
  }

  const addAnswer = (questionId: string) => {
    if (!quiz) return
    
    const question = quiz.questions.find(q => q.id === questionId)
    if (!question) return
    
    setQuiz({
      ...quiz,
      questions: quiz.questions.map(q => 
        q.id === questionId
          ? {
              ...q,
              answers: [
                ...q.answers,
                {
                  id: `new_${Date.now()}_${q.answers.length + 1}`,
                  text: "",
                  isCorrect: false,
                  color: answerColors[q.answers.length % answerColors.length],
                  image_url: null,
                },
              ],
            }
          : q
      ),
    })
  }

  const removeAnswer = (questionId: string, answerId: string) => {
    if (!quiz) return
    
    const question = quiz.questions.find(q => q.id === questionId)
    if (!question || question.answers.length <= 2) return
    
    if (skipAnswerDeleteConfirmation) {
      // If skipping confirmation, delete immediately
      deleteAnswer(questionId, answerId)
    } else {
      // Otherwise show confirmation dialog
      setAnswerToDelete({ questionId, answerId })
      setShowDeleteAnswerConfirm(true)
    }
  }

  const confirmDeleteAnswer = () => {
    if (answerToDelete) {
      deleteAnswer(answerToDelete.questionId, answerToDelete.answerId)
      setAnswerToDelete(null)
      setShowDeleteAnswerConfirm(false)
    }
  }

  const deleteAnswer = (questionId: string, answerId: string) => {
    setQuiz({
      ...quiz!,
      questions: quiz!.questions.map(q => 
        q.id === questionId
          ? {
              ...q,
              answers: q.answers.filter(a => a.id !== answerId),
            }
          : q
      ),
    })
  }

  const saveQuiz = async () => {
    if (!quiz || !user) return

    setSaving(true)
    try {
      // Update quiz basic info
      const { error: quizError } = await supabase
        .from("quizzes")
        .update({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          language: quiz.language,
          is_public: quiz.is_public,
          updated_at: new Date().toISOString(),
        })
        .eq("id", quiz.id)

      if (quizError) throw quizError

      // Handle questions
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i]

        if (question.id.startsWith("new_")) {
          // Create new question
          const { data: questionData, error: questionError } = await supabase
            .from("questions")
            .insert({
              quiz_id: quiz.id,
              question_text: question.text,
              time_limit: question.timeLimit,
              points: question.points,
              image_url: question.image_url,
              order_index: i,
            })
            .select()
            .single()

          if (questionError) throw questionError

          // Create answers for new question
          const answersToInsert = question.answers.map((answer, index) => ({
            question_id: questionData.id,
            answer_text: answer.text,
            is_correct: answer.isCorrect,
            color: answer.color,
            image_url: answer.image_url,
            order_index: index,
          }))

          const { error: answersError } = await supabase.from("answers").insert(answersToInsert)

          if (answersError) throw answersError
        } else {
          // Update existing question
          const { error: questionError } = await supabase
            .from("questions")
            .update({
              question_text: question.text,
              time_limit: question.timeLimit,
              points: question.points,
              image_url: question.image_url,
              order_index: i,
            })
            .eq("id", question.id)

          if (questionError) throw questionError

          // Update answers
          for (let j = 0; j < question.answers.length; j++) {
            const answer = question.answers[j]
            const { error: answerError } = await supabase
              .from("answers")
              .update({
                answer_text: answer.text,
                is_correct: answer.isCorrect,
                color: answer.color,
                image_url: answer.image_url,
                order_index: j,
              })
              .eq("id", answer.id)

            if (answerError) throw answerError
          }
        }
      }

      toast({
        title: "Berhasil",
        description: "Quiz berhasil disimpan",
        variant: "default",
      })
      router.push("/dashboard")
    } catch (error) {
      console.error("Error saving quiz:", error)
      toast({
        title: "Gagal",
        description: "Gagal menyimpan quiz. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Memuat quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz tidak ditemukan</h2>
          <p className="text-gray-600 mb-6">Quiz yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-blue-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <Slack className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Edit Quiz</span>
              </div>
            </div>
            <Button
              onClick={saveQuiz}
              disabled={saving || !quiz.title.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
        {/* Quiz Info */}
          <Card className="shadow-lg border-blue-200 mb-8">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 rounded-t-lg">
              <CardTitle className="text-blue-800">Informasi Quiz</CardTitle>
          </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-700 font-medium">
                  Judul Quiz *
                </Label>
              <Input
                id="title"
                value={quiz.title}
                onChange={(e) => updateQuiz("title", e.target.value)}
                placeholder="Masukkan judul quiz..."
                  required
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-700 font-medium">
                  Deskripsi (Opsional)
                </Label>
              <Textarea
                id="description"
                value={quiz.description || ""}
                onChange={(e) => updateQuiz("description", e.target.value)}
                  placeholder="Jelaskan tentang quiz ini..."
                  rows={3}
                  className="border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Category & Language */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-700 font-medium">
                    Kategori
                  </Label>
                  <Select
                    value={quiz.category}
                    onValueChange={(value) => updateQuiz("category", value)}
                  >
                    <SelectTrigger className="border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language" className="text-gray-700 font-medium">
                    Bahasa
                  </Label>
                  <Select
                    value={quiz.language}
                    onValueChange={(value) => updateQuiz("language", value)}
                  >
                    <SelectTrigger className="border-blue-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Pilih bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Public Toggle */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="is_public" id="is_public_label" className="text-base font-medium text-gray-800">
                      Public Quizz
                    </Label>
                    <p className="text-sm text-gray-600">Izinkan pengguna lain untuk menghost quiz ini</p>
                  </div>
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={quiz.is_public}
                      onChange={(e) => updateQuiz("is_public", e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                      aria-labelledby="is_public_label"
                      title="Public Quiz Toggle"
                    />
                  </div>
                </div>

                {/* Public/Private Info */}
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-blue-800">
                          {quiz.is_public ? "Public Quiz" : "Quiz Private"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">
                        {quiz.is_public
                          ? "Quiz ini dapat dilihat dan digunakan oleh pengguna lain."
                          : "Quiz ini hanya dapat dilihat dan digunakan oleh Anda."}
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
          <Card className="shadow-lg border-blue-200">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 rounded-t-lg">
                <div className="flex items-center justify-between">
                <CardTitle className="text-blue-800">Pertanyaan Quiz</CardTitle>
                <Button
                  onClick={addQuestion}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" /> Tambah Manual
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Questions List */}
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-8">
                  {quiz.questions.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-gray-500">
                        Belum ada pertanyaan. Tambahkan pertanyaan secara manual.
                      </p>
                    </div>
                  ) : (
                    quiz.questions.map((question, qIndex) => (
                      <div
                        key={question.id}
                        className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium text-gray-800">
                            Pertanyaan {qIndex + 1}
                          </h3>
                    <Button
                            variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                            <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                        <div className="space-y-4">
                                          {/* Question Text */}
                          <div>
                            <Label htmlFor={`q-${question.id}`} className="text-sm text-gray-600">
                              Teks Pertanyaan
                            </Label>
                            <Textarea
                              id={`q-${question.id}`}
                              value={question.text}
                              onChange={(e) =>
                                updateQuestion(question.id, "text", e.target.value)
                              }
                              placeholder="Masukkan pertanyaan..."
                              className="mt-1"
                            />
                          </div>
                          
                          {/* Question Image */}
                          <div>
                            <ImageUpload
                              imageUrl={question.image_url || null}
                              onImageChange={(url) => updateQuestion(question.id, "image_url", url)}
                              label="Gambar Pertanyaan (Opsional)"
                            />
                          </div>

                          {/* Time & Points */}
                          <div className="grid grid-cols-2 gap-4">
                  <div>
                              <Label htmlFor={`time-${question.id}`} className="text-sm text-gray-600">
                                Waktu (detik)
                    </Label>
                    <Input
                                id={`time-${question.id}`}
                      type="number"
                                min="5"
                                max="120"
                      value={question.timeLimit}
                                onChange={(e) =>
                                  updateQuestion(
                                    question.id,
                                    "timeLimit",
                                    parseInt(e.target.value) || 20
                                  )
                                }
                      className="mt-1"
                    />
                  </div>
                  <div>
                              <Label htmlFor={`points-${question.id}`} className="text-sm text-gray-600">
                      Poin
                    </Label>
                    <Input
                                id={`points-${question.id}`}
                      type="number"
                                min="100"
                                step="100"
                      value={question.points}
                                onChange={(e) =>
                                  updateQuestion(
                                    question.id,
                                    "points",
                                    parseInt(e.target.value) || 1000
                                  )
                                }
                      className="mt-1"
                    />
                  </div>
                </div>

                          <Separator />

                {/* Answers */}
                          <div className="space-y-3">
                            <Label className="text-sm text-gray-600">Jawaban</Label>
                            {question.answers.map((answer, aIndex) => (
                      <div
                        key={answer.id}
                                className="flex items-center space-x-3"
                              >
                                                                <div
                                  className="w-4 h-4 rounded-full shrink-0"
                                  style={{ backgroundColor: answer.color }}
                                ></div>
                                <div className="flex-1 space-y-2">
                                  <Input
                                    value={answer.text}
                                    onChange={(e) =>
                                      updateAnswer(
                                        question.id,
                                        answer.id,
                                        "text",
                                        e.target.value
                                      )
                                    }
                                    placeholder={`Jawaban ${aIndex + 1}`}
                                    className="w-full"
                                  />
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => {
                                        const fileInput = document.createElement('input');
                                        fileInput.type = 'file';
                                        fileInput.accept = 'image/*';
                                        fileInput.onchange = async (e) => {
                                          const file = (e.target as HTMLInputElement).files?.[0];
                                          if (file) {
                                            const { uploadImage } = await import('@/lib/upload-image');
                                            const url = await uploadImage(file);
                                            if (url) {
                                              updateAnswer(question.id, answer.id, "image_url", url);
                                            }
                                          }
                                        };
                                        fileInput.click();
                                      }}
                                    >
                                      <ImageIcon className="h-3 w-3 mr-1" />
                                      {answer.image_url ? 'Ganti Gambar' : 'Tambah Gambar'}
                                    </Button>
                                    
                                    {answer.image_url && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs text-red-500 hover:text-red-700"
                                        onClick={() => updateAnswer(question.id, answer.id, "image_url", null)}
                                      >
                                        Hapus Gambar
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {answer.image_url && (
                                    <div className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200">
                                      <img 
                                        src={answer.image_url} 
                                        alt={`Gambar untuk jawaban ${aIndex + 1}`}
                                        className="object-cover w-full h-full"
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="radio"
                                      id={`correct-${answer.id}`}
                                      name={`correct-${question.id}`}
                                      checked={answer.isCorrect}
                                      aria-label={`Tandai jawaban ${aIndex + 1} sebagai benar`}
                                      onChange={() => setCorrectAnswer(question.id, answer.id)}
                                      className="text-blue-600"
                                    />
                                    <Label
                                      htmlFor={`correct-${answer.id}`}
                                      className="text-xs text-gray-600"
                                    >
                                      Benar
                                    </Label>
                                  </div>
                                  {question.answers.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAnswer(question.id, answer.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                            {question.answers.length < 6 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addAnswer(question.id)}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 mt-2"
                              >
                                <Plus className="w-3 h-3 mr-1" /> Tambah Jawaban
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

          {/* Add Question Button */}
              <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <Button
              onClick={addQuestion}
              variant="outline"
                  className="border-dashed border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pertanyaan
            </Button>
          </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Question Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteQuestionConfirm} onOpenChange={setShowDeleteQuestionConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pertanyaan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pertanyaan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Switch
              id="skip-question-confirmation"
              checked={skipQuestionDeleteConfirmation}
              onCheckedChange={setSkipQuestionDeleteConfirmation}
            />
            <Label htmlFor="skip-question-confirmation" className="text-sm text-gray-600">
              Jangan ingatkan lagi
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteQuestionConfirm(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuestion} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Answer Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAnswerConfirm} onOpenChange={setShowDeleteAnswerConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jawaban</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus jawaban ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Switch
              id="skip-answer-confirmation"
              checked={skipAnswerDeleteConfirmation}
              onCheckedChange={setSkipAnswerDeleteConfirmation}
            />
            <Label htmlFor="skip-answer-confirmation" className="text-sm text-gray-600">
              Jangan ingatkan lagi
            </Label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAnswerConfirm(false)}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnswer} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <QuizPageWithLoading 
      animation="scaleRotate"
      customLoadingMessage="Memuat halaman edit quiz..."
    >
      <EditQuizPageContent params={params} />
    </QuizPageWithLoading>
  );
}
