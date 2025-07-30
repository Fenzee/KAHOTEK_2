"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Zap, Trophy, Heart, Play, Star, CheckCircle, BookOpen, Gamepad2 } from "lucide-react"
import NavbarDemo from "@/components/resizable-navbar-demo"
import { AnimatedElement } from "@/components/ui/animated-element";
import { LoadingDemo } from "@/components/ui/loading-demo";
import { motion } from "framer-motion";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-16 scroll-smooth">
      {/* Navigation */}
      <NavbarDemo />

      {/* Hero Section */}
      <section id="learn" className="pt-28 pb-20 md:pb-32 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <AnimatedElement preset="fadeInLeft" className="space-y-8 max-w-2xl">
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 mb-4"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Platform Kuis #1 di Indonesia
                </motion.div>
                <AnimatedElement preset="fadeIn" delay={0.2}>
                  <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                    Buat dan Mainkan{" "}
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Kuis Interaktif
                    </span>{" "}
                    Bersama Teman
                  </h1>
                </AnimatedElement>
                <AnimatedElement preset="fadeIn" delay={0.4}>
                  <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                    GolekQuiz menyediakan platform kuis interaktif dengan fitur multiplayer realtime, leaderboard dinamis,
                    dan sistem pertemanan untuk pengalaman belajar yang menyenangkan.
                  </p>
                </AnimatedElement>
              </div>

              <AnimatedElement preset="fadeInUp" delay={0.6}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/register">
                    <motion.div
                      whileHover={{ 
                        scale: 1.05,
                        transition: { type: "spring", stiffness: 400, damping: 15 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 text-lg shadow-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 relative overflow-hidden group"
                      >
                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                          initial={{ x: '-100%' }}
                          whileHover={{ x: '100%' }}
                        />
                        
                        <motion.div
                          whileHover={{ x: 2 }}
                          className="flex items-center relative z-10"
                        >
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Play className="mr-2 h-5 w-5" />
                          </motion.div>
                          Mulai Sekarang
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </motion.div>
                        </motion.div>
                      </Button>
                    </motion.div>
                  </Link>
                  
                  <Link href="#features">
                    <motion.div
                      whileHover={{ 
                        scale: 1.05,
                        transition: { type: "spring", stiffness: 400, damping: 15 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        variant="outline"
                        className="px-8 py-3 text-lg bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 group relative overflow-hidden"
                      >
                        {/* Subtle glow effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                        />
                        
                        <motion.span
                          whileHover={{ x: 2 }}
                          className="relative z-10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
                        >
                          Lihat Fitur
                        </motion.span>
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </AnimatedElement>

              <AnimatedElement preset="fadeInUp" delay={0.8}>
                <div className="flex items-center space-x-8 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">1000+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Pengguna Aktif</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">500+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Kuis Dibuat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">10K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Game Dimainkan</div>
                  </div>
                </div>
              </AnimatedElement>
            </AnimatedElement>

            <AnimatedElement preset="fadeInRight" className="relative w-full max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 blur-3xl opacity-20 rounded-full"></div>
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-500">Live Quiz</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600">12 Online</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold">Sejarah Indonesia</h3>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium">Pertanyaan 3 dari 10</span>
                      <div className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
                        <span className="text-orange-600 font-medium">15s</span>
                      </div>
                    </div>

                    <div className="text-lg font-medium mb-4">Siapa proklamator kemerdekaan Indonesia?</div>

                    <div className="grid grid-cols-2 gap-3">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg text-center font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 cursor-pointer transition-colors"
                      >
                        Soekarno & Hatta
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center font-medium hover:bg-red-200 dark:hover:bg-red-900/50 cursor-pointer transition-colors"
                      >
                        Soeharto
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg text-center font-medium hover:bg-green-200 dark:hover:bg-green-900/50 cursor-pointer transition-colors"
                      >
                        Tan Malaka
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-lg text-center font-medium hover:bg-yellow-200 dark:hover:bg-yellow-900/50 cursor-pointer transition-colors"
                      >
                        Ki Hajar
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>12 pemain online</span>
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">ABC123</span>
                  </div>
                </div>
              </motion.div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800 scroll-mt-20">
        <div className="container mx-auto px-4">
          <AnimatedElement preset="fadeInUp" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fitur{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Unggulan
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Nikmati pengalaman kuis interaktif dengan teknologi realtime terdepan
            </p>
          </AnimatedElement>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatedElement preset="fadeInUp" delay={0.1}>
              <motion.div 
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500 cursor-pointer relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                
                <motion.div 
                  whileHover={{ 
                    scale: 1.15, 
                    rotate: 10,
                    transition: { type: "spring", stiffness: 400, damping: 15 }
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 relative z-10 group-hover:shadow-lg group-hover:shadow-blue-500/50"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Users className="h-6 w-6 text-white" />
                  </motion.div>
                </motion.div>
                
                <motion.h3 
                  className="text-xl font-bold mb-2 relative z-10 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Multiplayer Realtime
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 relative z-10 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Main bersama hingga 50 pemain dalam satu sesi dengan sinkronisasi realtime
                </motion.p>
              </motion.div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.2}>
              <motion.div 
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 cursor-pointer relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                
                <motion.div 
                  whileHover={{ 
                    scale: 1.15, 
                    rotate: 10,
                    transition: { type: "spring", stiffness: 400, damping: 15 }
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 relative z-10 group-hover:shadow-lg group-hover:shadow-purple-500/50"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Zap className="h-6 w-6 text-white" />
                  </motion.div>
                </motion.div>
                
                <motion.h3 
                  className="text-xl font-bold mb-2 relative z-10 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Interaksi Langsung
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 relative z-10 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Chat, emoji reaction, dan leaderboard yang update secara realtime
                </motion.p>
              </motion.div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.3}>
              <motion.div 
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 hover:shadow-2xl hover:shadow-green-500/25 transition-all duration-500 cursor-pointer relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                
                <motion.div 
                  whileHover={{ 
                    scale: 1.15, 
                    rotate: 10,
                    transition: { type: "spring", stiffness: 400, damping: 15 }
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 relative z-10 group-hover:shadow-lg group-hover:shadow-green-500/50"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Trophy className="h-6 w-6 text-white" />
                  </motion.div>
                </motion.div>
                
                <motion.h3 
                  className="text-xl font-bold mb-2 relative z-10 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Sistem Poin
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 relative z-10 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Dapatkan poin berdasarkan kecepatan dan ketepatan jawaban
                </motion.p>
              </motion.div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.4}>
              <motion.div 
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="group p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 hover:shadow-2xl hover:shadow-pink-500/25 transition-all duration-500 cursor-pointer relative overflow-hidden"
              >
                {/* Glow effect on hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-pink-400/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                />
                
                <motion.div 
                  whileHover={{ 
                    scale: 1.15, 
                    rotate: 10,
                    transition: { type: "spring", stiffness: 400, damping: 15 }
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 relative z-10 group-hover:shadow-lg group-hover:shadow-pink-500/50"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Heart className="h-6 w-6 text-white" />
                  </motion.div>
                </motion.div>
                
                <motion.h3 
                  className="text-xl font-bold mb-2 relative z-10 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Sistem Pertemanan
                </motion.h3>
                
                <motion.p 
                  className="text-gray-600 dark:text-gray-300 relative z-10 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300"
                  whileHover={{ x: 2 }}
                >
                  Tambah teman, buat grup, dan tantang mereka dalam duel 1v1
                </motion.p>
              </motion.div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section id="game" className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 scroll-mt-20">
        <div className="container mx-auto px-4">
          <AnimatedElement preset="fadeInUp" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Mode Permainan</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Pilih mode bermain yang sesuai dengan kebutuhan dan preferensi Anda
            </p>
          </AnimatedElement>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedElement preset="fadeInUp" delay={0.1}>
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <span className="text-white text-2xl font-bold">1</span>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Single Player</h3>
                  <p className="text-gray-600 dark:text-gray-300">Fokus pada pembelajaran pribadi tanpa tekanan waktu</p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Tanpa batas waktu</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Penjelasan detail setiap jawaban</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Navigasi soal bebas</span>
                  </li>
                </ul>

                <Button className="w-full bg-transparent" variant="outline">
                  Mulai Solo
                </Button>
              </motion.div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.2}>
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gradient-to-r from-purple-500 to-pink-500 relative"
              >
                <motion.div 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2"
                >
                  <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Paling Populer
                  </span>
                </motion.div>

                <div className="text-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Users className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Multiplayer</h3>
                  <p className="text-gray-600 dark:text-gray-300">Berkompetisi dengan pemain lain secara realtime</p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Host mengontrol jalannya kuis</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Leaderboard realtime</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Chat dan emoji reactions</span>
                  </li>
                </ul>

                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Host Game
                </Button>
              </motion.div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.3}>
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-center mb-6">
                  <motion.div 
                    whileHover={{ rotate: 10 }}
                    className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <span className="text-white text-lg font-bold">VS</span>
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2">Versus (1v1)</h3>
                  <p className="text-gray-600 dark:text-gray-300">Duel head-to-head dengan teman atau pemain lain</p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Soal yang sama untuk kedua pemain</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Waktu terbatas per soal</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>Progress lawan terlihat realtime</span>
                  </li>
                </ul>

                <Button className="w-full bg-transparent" variant="outline">
                  Challenge Friend
                </Button>
              </motion.div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz" className="py-20 bg-white dark:bg-gray-800 scroll-mt-20">
        <div className="container mx-auto px-4">
          <AnimatedElement preset="fadeInUp" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Jelajahi{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Berbagai Kuis
              </span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Temukan ribuan kuis dari berbagai kategori yang dibuat oleh komunitas
            </p>
          </AnimatedElement>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedElement preset="fadeInUp" delay={0.1}>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Pendidikan</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Berbagai kuis untuk membantu belajar mata pelajaran sekolah, dari matematika hingga sejarah.
                </p>
                <Button variant="outline" className="w-full">
                  Jelajahi Kuis Pendidikan
                </Button>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.2}>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hiburan</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Kuis tentang film, musik, selebriti, dan semua hal menyenangkan untuk menghibur diri.
                </p>
                <Button variant="outline" className="w-full">
                  Jelajahi Kuis Hiburan
                </Button>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.3}>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Kompetisi</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Tantang teman-temanmu dalam kuis kompetitif yang menguji pengetahuan dan kecepatan.
                </p>
                <Button variant="outline" className="w-full">
                  Jelajahi Kuis Kompetisi
                </Button>
              </div>
            </AnimatedElement>
          </div>

          <div className="text-center mt-10">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              Lihat Semua Kuis
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <AnimatedElement preset="fadeInUp" className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Apa Kata Pengguna</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Ribuan pengguna telah merasakan pengalaman belajar yang menyenangkan
            </p>
          </AnimatedElement>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedElement preset="fadeInUp" delay={0.1}>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "GolekQuiz membuat belajar jadi sangat menyenangkan! Fitur multiplayer-nya bikin kompetisi dengan teman
                  jadi seru banget."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    A
                  </div>
                  <div>
                    <div className="font-semibold">Andi Pratama</div>
                    <div className="text-sm text-gray-500">Mahasiswa UI</div>
                  </div>
                </div>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.2}>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "Sebagai guru, saya sangat terbantu dengan platform ini. Siswa jadi lebih antusias belajar dengan sistem
                  kuis yang interaktif."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    S
                  </div>
                  <div>
                    <div className="font-semibold">Sari Dewi</div>
                    <div className="text-sm text-gray-500">Guru SMA</div>
                  </div>
                </div>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.3}>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  "Interface-nya user-friendly dan fitur realtime-nya bekerja dengan sempurna. Recommended banget untuk
                  belajar bareng!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
                    R
                  </div>
                  <div>
                    <div className="font-semibold">Rizki Hakim</div>
                    <div className="text-sm text-gray-500">Developer</div>
                  </div>
                </div>
              </div>
            </AnimatedElement>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <AnimatedElement preset="fadeInUp" className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Siap Memulai Petualangan Quiz Anda?</h2>
            <p className="text-xl text-blue-100 mb-8">
              Bergabunglah dengan ribuan pengguna yang sudah merasakan pengalaman belajar yang menyenangkan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Mulai Gratis Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg font-semibold bg-transparent"
              >
                Lihat Demo
              </Button>
            </div>
            <p className="text-blue-100 text-sm mt-4">Gratis selamanya • Tidak perlu kartu kredit</p>
          </AnimatedElement>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <AnimatedElement preset="fadeInUp" delay={0.1}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">GQ</span>
                  </div>
                  <span className="text-xl font-bold">GolekQuiz</span>
                </div>
                <p className="text-gray-400">
                  Platform kuis interaktif terbaik untuk pengalaman belajar yang menyenangkan.
                </p>
                <div className="flex space-x-4">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                    <span className="text-sm">f</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                    <span className="text-sm">t</span>
                  </div>
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 cursor-pointer transition-colors">
                    <span className="text-sm">ig</span>
                  </div>
                </div>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.2}>
              <div>
                <h4 className="font-semibold mb-4">Produk</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="#features" className="hover:text-white transition-colors">
                      Fitur
                    </Link>
                  </li>
                  <li>
                    <Link href="#game" className="hover:text-white transition-colors">
                      Mode Game
                    </Link>
                  </li>
                  <li>
                    <Link href="#quiz" className="hover:text-white transition-colors">
                      Kuis
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      API
                    </Link>
                  </li>
                </ul>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.3}>
              <div>
                <h4 className="font-semibold mb-4">Dukungan</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Kontak
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Status
                    </Link>
                  </li>
                </ul>
              </div>
            </AnimatedElement>

            <AnimatedElement preset="fadeInUp" delay={0.4}>
              <div>
                <h4 className="font-semibold mb-4">Perusahaan</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Tentang Kami
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Karir
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-white transition-colors">
                      Press
                    </Link>
                  </li>
                </ul>
              </div>
            </AnimatedElement>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; 2024 GolekQuiz. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Loading Demo Component */}
      <LoadingDemo />
    </div>
  )
}
