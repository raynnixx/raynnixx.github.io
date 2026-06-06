import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Brain, Eye, Clock, Users, Heart, AlertTriangle, CheckCircle, 
  Target, BookOpen, BarChart3, Award, ArrowRight, Menu, X, Download, 
  RefreshCw, Star, TrendingUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

// Types
interface SurveyData {
  daily: number;
  weekly1_2: number;
  weekly3_4: number;
  less: number;
  total: number;
}

interface BenefitData {
  name: string;
  value: number;
}

interface RecItem {
  id: number;
  text: string;
  completed: boolean;
}

interface QuizAnswer {
  question: number;
  answer: number;
}

const POSITIVE_COLOR = '#22c55e';
const NEGATIVE_COLOR = '#ef4444';

// Survey initial data from the project (11 respondents)
const INITIAL_SURVEY: SurveyData = {
  daily: 5,
  weekly1_2: 3,
  weekly3_4: 2,
  less: 1,
  total: 11
};

const INITIAL_BENEFITS: BenefitData[] = [
  { name: 'Снятие стресса и отдых', value: 9 },
  { name: 'Развитие логического мышления', value: 8 },
  { name: 'Улучшение реакции и внимания', value: 7 },
  { name: 'Развитие командной работы', value: 5 },
  { name: 'Изучение английского', value: 4 },
  { name: 'Креативность и творчество', value: 4 },
];

const INITIAL_NEGATIVE = { no: 8, yes: 3 }; // 72.7% no negative

const SLEEP_DATA = [
  { name: 'Иногда', value: 7, percent: '63.6%' },
  { name: 'Регулярно', value: 1, percent: '9.1%' },
  { name: 'Нет проблем', value: 3, percent: '27.3%' },
];

// History timeline data
const HISTORY = [
  { year: '1952', title: 'OXO', desc: 'Первая компьютерная игра — крестики-нолики на ЭВМ' },
  { year: '1958', title: 'Tennis for Two', desc: 'Первая интерактивная игра на осциллографе' },
  { year: '1972', title: 'Pong', desc: 'Начало коммерческой индустрии (Atari)' },
  { year: '1980-е', title: 'Эра приставок', desc: 'Pac-Man, Super Mario, Tetris, Nintendo и Sega' },
  { year: '1990-е', title: '3D и сети', desc: 'Doom, Quake, Warcraft, StarCraft' },
  { year: '2000-е', title: 'MMO и онлайн', desc: 'World of Warcraft, расцвет многопользовательских игр' },
  { year: '2010–2020-е', title: 'Современность', desc: 'Мобильные игры, VR/AR, киберспорт, облачный гейминг' },
];

// Game classification
const GENRES = [
  { name: 'Экшен (Action)', icon: Target, desc: 'Быстрая реакция, шутеры, файтинги, аркады', color: 'bg-red-500/10 text-red-400' },
  { name: 'RPG', icon: Award, desc: 'Развитие персонажа, прокачка, сюжетные линии', color: 'bg-purple-500/10 text-purple-400' },
  { name: 'Стратегии', icon: Brain, desc: 'Планирование, управление ресурсами, тактика', color: 'bg-blue-500/10 text-blue-400' },
  { name: 'Симуляторы', icon: Gamepad2, desc: 'Имитация реальных процессов и вождения', color: 'bg-emerald-500/10 text-emerald-400' },
  { name: 'Песочницы', icon: Star, desc: 'Свобода действий: Minecraft, Roblox, GTA', color: 'bg-amber-500/10 text-amber-400' },
  { name: 'Хорроры', icon: AlertTriangle, desc: 'Создание атмосферы страха и напряжения', color: 'bg-zinc-500/10 text-zinc-400' },
];

// Positive effects
const POSITIVES = [
  { icon: Brain, title: 'Развитие когнитивных способностей', text: 'Логическое мышление, память, концентрация внимания' },
  { icon: Target, title: 'Улучшение реакции и моторики', text: 'Тренировка скорости реакции, координации глаз–рука' },
  { icon: TrendingUp, title: 'Навыки принятия решений', text: 'Быстрый анализ ситуации в условиях ограниченного времени' },
  { icon: BookOpen, title: 'Изучение иностранных языков', text: 'Расширение словарного запаса при игре на английском' },
  { icon: Users, title: 'Социализация и командная работа', text: 'Взаимодействие в команде, общение с друзьями по всему миру' },
  { icon: Heart, title: 'Снятие стресса и разгрузка', text: 'Эффективный способ релаксации после учебного дня' },
  { icon: Star, title: 'Развитие креативности', text: 'Игры-песочницы стимулируют творческое мышление' },
  { icon: Award, title: 'Профессиональные перспективы', text: 'Карьера в киберспорте, стриминге и разработке игр' },
];

// Negative effects
const NEGATIVES = [
  { icon: AlertTriangle, title: 'Игровая зависимость', text: 'Gaming Disorder официально признана ВОЗ (МКБ-11). Потеря контроля над временем' },
  { icon: Eye, title: 'Проблемы со зрением', text: 'Синдром компьютерного зрения, сухость глаз, усталость от длительного экрана' },
  { icon: Clock, title: 'Нарушения сна', text: 'Игра допоздна приводит к бессоннице и хронической усталости' },
  { icon: Target, title: 'Снижение успеваемости', text: 'Отнимает время от учёбы и других важных дел' },
  { icon: AlertTriangle, title: 'Психологические проблемы', text: 'Агрессивность, социальная изоляция, тревожность, снижение эмпатии' },
  { icon: Heart, title: 'Проблемы со здоровьем', text: 'Нарушения осанки, гиподинамия, туннельный синдром запястья' },
];

// Recommendations
const BASE_RECOMMENDATIONS: RecItem[] = [
  { id: 1, text: 'Контролировать время игры — заранее устанавливать лимит и не превышать его', completed: false },
  { id: 2, text: 'Не играть допоздна — завершать игру минимум за 1 час до сна', completed: false },
  { id: 3, text: 'Делать перерывы — после 30–45 минут игры отдыхать 5–10 минут', completed: false },
  { id: 4, text: 'Беречь зрение — соблюдать расстояние до монитора и делать гимнастику для глаз', completed: false },
  { id: 5, text: 'Следить за осанкой — сидеть прямо, не сутулиться', completed: false },
  { id: 6, text: 'Совмещать игры с физической активностью — прогулки, спорт', completed: false },
  { id: 7, text: 'Выбирать игры осознанно — отдавать предпочтение развивающим проектам', completed: false },
  { id: 8, text: 'Не заменять реальное общение виртуальным', completed: false },
  { id: 9, text: 'Контролировать эмоциональное состояние — при раздражительности делать перерыв', completed: false },
  { id: 10, text: 'Использовать игры как отдых, а не как основное занятие', completed: false },
];

// Age groups
const AGE_GROUPS = [
  { 
    age: '3–6 лет (Дошкольный)', 
    time: '15–20 минут в день', 
    tips: 'Только развивающие, строго возрастные игры. Психика очень уязвима.' 
  },
  { 
    age: '7–10 лет (Младший школьный)', 
    time: '30–60 минут в день', 
    tips: 'Контроль родителей. Предпочтение образовательным и развивающим играм.' 
  },
  { 
    age: '11–14 лет (Подростки)', 
    time: '1–1,5 часа в день', 
    tips: 'Важно соблюдать режим. Следить за содержанием. Баланс с учебой и спортом.' 
  },
  { 
    age: '15–17 лет (Старшие подростки)', 
    time: '1,5–2 часа в день', 
    tips: 'Самоконтроль. Избегать ночных сессий. Развивать осознанность.' 
  },
];

// Sources
const SOURCES = [
  'Всемирная организация здравоохранения. МКБ-11. Игровое расстройство.',
  'Newzoo. Global Games Market Report 2023.',
  'Американская психологическая ассоциация. Resolution on Violent Video Games, 2020.',
  'Bavelier D., Green C. S. Action Video Game Modifies Visual Selective Attention. Nature, 2003.',
  'Przybylski A. K. A Large-Scale Test of the Goldilocks Hypothesis. Psychological Science, 2017.',
  'Войскунский А. Е. Актуальные проблемы зависимости от интернета. Психологический журнал, 2004.',
  'Зайцева О. Б. Влияние компьютерных игр на психическое развитие детей и подростков. Молодой учёный, 2016.',
  'Панъевропейская система возрастных рейтингов PEGI.',
];

// Quiz questions for self-assessment
const QUIZ_QUESTIONS = [
  {
    q: 'Как часто вы играете в компьютерные игры?',
    options: ['Каждый день', '3–5 раз в неделю', '1–2 раза в неделю', 'Реже 1 раза в неделю']
  },
  {
    q: 'Сколько времени в среднем длится одна игровая сессия?',
    options: ['Менее 1 часа', '1–2 часа', '2–3 часа', 'Более 3 часов']
  },
  {
    q: 'Часто ли вы играете после 23:00?',
    options: ['Почти никогда', 'Иногда (1–2 раза в неделю)', 'Довольно часто', 'Почти каждый день']
  },
  {
    q: 'Бывает ли, что игры мешают учёбе или делам?',
    options: ['Никогда', 'Редко', 'Иногда', 'Часто']
  },
  {
    q: 'Замечаете ли вы усталость глаз или раздражительность после игр?',
    options: ['Нет', 'Редко', 'Иногда', 'Часто']
  },
];

const App: React.FC = () => {
  // State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  
  // Survey states (live updating)
  const [surveyData, setSurveyData] = useState<SurveyData>(INITIAL_SURVEY);
  const [benefitsData, setBenefitsData] = useState<BenefitData[]>(INITIAL_BENEFITS);
  const [negativeData, setNegativeData] = useState(INITIAL_NEGATIVE);
  const [sleepData, setSleepData] = useState(SLEEP_DATA);
  
  // Interactive survey form
  const [userSurvey, setUserSurvey] = useState({
    freq: '',
    stress: '',
    sleep: '',
    negative: '',
  });
  const [hasAddedSurvey, setHasAddedSurvey] = useState(false);

  // Recommendations checklist with persistence
  const [recommendations, setRecommendations] = useState<RecItem[]>(BASE_RECOMMENDATIONS);
  const [progress, setProgress] = useState(0);

  // Self-assessment quiz
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<{ score: number; message: string; advice: string } | null>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);

  // Classification filter
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  // Load recommendations from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gameRecommendations');
    if (saved) {
      const parsed = JSON.parse(saved);
      setRecommendations(parsed);
    }
  }, []);

  // Calculate and save progress
  useEffect(() => {
    const completed = recommendations.filter(r => r.completed).length;
    const newProgress = Math.round((completed / recommendations.length) * 100);
    setProgress(newProgress);
    localStorage.setItem('gameRecommendations', JSON.stringify(recommendations));
  }, [recommendations]);

  // Scrollspy for active nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
    );

    const sections = document.querySelectorAll('section[id]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // Smooth scroll function
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition - bodyRect - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  // Interactive: Add user survey response
  const submitUserSurvey = () => {
    if (!userSurvey.freq || !userSurvey.stress || !userSurvey.sleep || !userSurvey.negative) {
      alert('Пожалуйста, ответьте на все вопросы анкеты');
      return;
    }

    // Update frequency
    const newSurvey = { ...surveyData };
    if (userSurvey.freq === 'daily') newSurvey.daily++;
    else if (userSurvey.freq === 'weekly1_2') newSurvey.weekly1_2++;
    else if (userSurvey.freq === 'weekly3_4') newSurvey.weekly3_4++;
    else newSurvey.less++;
    newSurvey.total++;
    setSurveyData(newSurvey);

    // Update benefits
    if (userSurvey.stress === 'yes') {
      const newBenefits = [...benefitsData];
      newBenefits[0].value++;
      setBenefitsData(newBenefits);
    }

    // Update negative
    const newNeg = { ...negativeData };
    if (userSurvey.negative === 'no') newNeg.no++;
    else newNeg.yes++;
    setNegativeData(newNeg);

    // Update sleep
    const newSleep = [...sleepData];
    if (userSurvey.sleep === 'sometimes') newSleep[0].value++;
    else if (userSurvey.sleep === 'regularly') newSleep[1].value++;
    else newSleep[2].value++;
    setSleepData(newSleep);

    setHasAddedSurvey(true);
    // Reset form
    setUserSurvey({ freq: '', stress: '', sleep: '', negative: '' });

    // Show success message
    setTimeout(() => {
      alert('Спасибо! Ваш ответ добавлен в общие результаты исследования.');
    }, 300);
  };

  const resetSurvey = () => {
    setSurveyData(INITIAL_SURVEY);
    setBenefitsData(INITIAL_BENEFITS);
    setNegativeData(INITIAL_NEGATIVE);
    setSleepData(SLEEP_DATA);
    setHasAddedSurvey(false);
    setUserSurvey({ freq: '', stress: '', sleep: '', negative: '' });
  };

  // Toggle recommendation
  const toggleRecommendation = (id: number) => {
    setRecommendations(prev =>
      prev.map(rec =>
        rec.id === id ? { ...rec, completed: !rec.completed } : rec
      )
    );
  };

  const resetRecommendations = () => {
    setRecommendations(BASE_RECOMMENDATIONS);
    localStorage.removeItem('gameRecommendations');
  };

  // Download recommendations as text file
  const downloadRecommendations = () => {
    const text = `РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОМУ ИСПОЛЬЗОВАНИЮ КОМПЬЮТЕРНЫХ ИГР\n\n` +
      `Прогресс: ${progress}%\n\n` +
      recommendations.map((rec, i) => 
        `${i + 1}. [${rec.completed ? '✓' : ' '}] ${rec.text}`
      ).join('\n\n') +
      `\n\n— Источник: Индивидуальный проект «Влияние компьютерных игр»\nУльяновский государственный технический университет, 2026`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'рекомендации_игры_польза_риски.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quiz logic
  const handleQuizAnswer = (qIndex: number, answerIndex: number) => {
    const existing = quizAnswers.findIndex(a => a.question === qIndex);
    let newAnswers;
    if (existing !== -1) {
      newAnswers = [...quizAnswers];
      newAnswers[existing] = { question: qIndex, answer: answerIndex };
    } else {
      newAnswers = [...quizAnswers, { question: qIndex, answer: answerIndex }];
    }
    setQuizAnswers(newAnswers);
  };

  const calculateQuizResult = () => {
    if (quizAnswers.length !== QUIZ_QUESTIONS.length) {
      alert('Пожалуйста, ответьте на все вопросы теста');
      return;
    }

    // Score: lower = better balance (0-20). Higher score = more risk
    let riskScore = 0;
    quizAnswers.forEach((ans) => {
      // Higher option index = higher risk
      riskScore += ans.answer; // 0-3 per question, total 0-15
    });

    const balanceScore = Math.round(100 - (riskScore / 15) * 100); // 100 best, 0 worst

    let message = '';
    let advice = '';

    if (balanceScore >= 85) {
      message = 'Отличный баланс!';
      advice = 'Вы очень ответственно подходите к играм. Продолжайте в том же духе и делитесь опытом с друзьями.';
    } else if (balanceScore >= 65) {
      message = 'Хороший баланс';
      advice = 'У вас в целом здоровое отношение к играм. Обратите внимание на время сна и перерывы.';
    } else if (balanceScore >= 45) {
      message = 'Средний баланс — есть над чем поработать';
      advice = 'Попробуйте установить чёткие лимиты времени и завершать игры раньше. Следите за самочувствием.';
    } else {
      message = 'Рекомендуется пересмотреть привычки';
      advice = 'Игры могут занимать слишком много времени. Начните с рекомендаций на сайте: лимит времени, перерывы и раннее завершение.';
    }

    setQuizResult({ score: balanceScore, message, advice });
    setShowQuizModal(true);
    setQuizAnswers([]); // reset for next time
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setQuizResult(null);
  };

  // Prepare chart data
  const frequencyChartData = [
    { name: 'Каждый день', value: Math.round((surveyData.daily / surveyData.total) * 100), count: surveyData.daily },
    { name: '1–2 раза/нед', value: Math.round((surveyData.weekly1_2 / surveyData.total) * 100), count: surveyData.weekly1_2 },
    { name: '3–4 раза/нед', value: Math.round((surveyData.weekly3_4 / surveyData.total) * 100), count: surveyData.weekly3_4 },
    { name: 'Реже', value: Math.round((surveyData.less / surveyData.total) * 100), count: surveyData.less },
  ];

  const benefitsChartData = benefitsData.map((b) => ({
    name: b.name.length > 22 ? b.name.substring(0, 20) + '…' : b.name,
    full: b.name,
    value: Math.round((b.value / surveyData.total) * 100),
    count: b.value
  }));

  const negativePieData = [
    { name: 'Не замечают отрицательного влияния', value: Math.round((negativeData.no / (negativeData.no + negativeData.yes)) * 100) },
    { name: 'Замечают отрицательное влияние', value: Math.round((negativeData.yes / (negativeData.no + negativeData.yes)) * 100) },
  ];

  const sleepChartData = sleepData.map((s) => ({
    name: s.name,
    value: Math.round((s.value / surveyData.total) * 100),
    count: s.value
  }));

  // Filter genres
  const filteredGenres = selectedGenre 
    ? GENRES.filter(g => g.name === selectedGenre) 
    : GENRES;

  const navItems = [
    { label: 'О проекте', id: 'about' },
    { label: 'Польза', id: 'benefits' },
    { label: 'Риски', id: 'risks' },
    { label: 'История и классификация', id: 'history' },
    { label: 'Результаты опроса', id: 'results' },
    { label: 'Рекомендации', id: 'recommendations' },
    { label: 'Источники', id: 'sources' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo('hero')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold tracking-tight text-lg">Игры: Польза и Риски</div>
              <div className="text-[10px] text-zinc-500 -mt-1">Индивидуальный проект • 2026</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 text-sm">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`nav-link transition-colors ${activeSection === item.id ? 'text-violet-400' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {item.label}
              </button>
            ))}
            <button 
              onClick={() => scrollTo('quiz')}
              className="px-5 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
            >
              Пройти тест <ArrowRight size={15} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-4 flex flex-col gap-3 text-sm"
            >
              {navItems.map(item => (
                <button key={item.id} onClick={() => scrollTo(item.id)} className="text-left py-1.5 text-zinc-300 hover:text-white">
                  {item.label}
                </button>
              ))}
              <button onClick={() => scrollTo('quiz')} className="mt-2 w-full py-2.5 bg-violet-600 rounded-lg font-medium">
                Пройти тест на баланс
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section id="hero" className="pt-16 pb-20 bg-[radial-gradient(#27272a_0.8px,transparent_1px)] bg-[length:4px_4px]">
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs tracking-[2px] mb-6 text-violet-400">
            УЛЬЯНОВСКИЙ ГОСУДАРСТВЕННЫЙ ТЕХНИЧЕСКИЙ УНИВЕРСИТЕТ • 2026
          </div>
          
          <h1 className="text-6xl md:text-7xl font-semibold tracking-tighter leading-[1.05] mb-6">
            Компьютерные игры:<br />польза и риски
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-zinc-400 mb-10">
            Просветительский сайт по результатам индивидуального проекта.<br />Для подростков и их родителей.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => scrollTo('benefits')} className="group px-8 py-3.5 bg-white text-zinc-950 font-medium rounded-2xl flex items-center justify-center gap-2 hover:bg-zinc-100 transition">
              Узнать о пользе <ArrowRight className="group-hover:translate-x-0.5 transition" />
            </button>
            <button onClick={() => scrollTo('results')} className="px-8 py-3.5 border border-zinc-700 hover:bg-zinc-900 rounded-2xl flex items-center justify-center gap-2 transition">
              Посмотреть результаты опроса
            </button>
            <button onClick={() => scrollTo('quiz')} className="px-8 py-3.5 border border-zinc-700 hover:bg-zinc-900 rounded-2xl flex items-center justify-center gap-2 transition">
              Пройти тест
            </button>
          </div>

          <div className="mt-14 flex justify-center gap-10 text-sm">
            <div><span className="font-semibold text-2xl text-white">2,7 млрд</span><div className="text-zinc-500">игроков в мире</div></div>
            <div><span className="font-semibold text-2xl text-white">11</span><div className="text-zinc-500">респондентов в опросе</div></div>
            <div><span className="font-semibold text-2xl text-white">81,8%</span><div className="text-zinc-500">отмечают пользу</div></div>
          </div>
        </div>
      </section>

      {/* ABOUT PROJECT */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800">
        <div className="grid md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <div className="uppercase text-xs tracking-[3px] text-violet-400 mb-3">ИНДИВИДУАЛЬНЫЙ ПРОЕКТ</div>
            <h2 className="section-title text-4xl font-semibold tracking-tighter">О проекте</h2>
          </div>
          <div className="md:col-span-3 space-y-6 text-lg text-zinc-300">
            <p>
              <strong>Цель работы:</strong> Разработать просветительский веб-сайт для подростков и их родителей, содержащий результаты анализа влияния компьютерных игр и практические рекомендации по безопасному геймингу.
            </p>
            <div>
              <p className="font-medium mb-2 text-white">Задачи исследования:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-base">
                <li>Проанализировать научную литературу</li>
                <li>Выявить позитивные и негативные эффекты</li>
                <li>Провести опрос среди целевой аудитории</li>
                <li>Сформулировать рекомендации</li>
                <li>Разработать информационный сайт</li>
              </ul>
            </div>
            <div className="pt-2 flex flex-wrap gap-x-10 gap-y-1 text-sm">
              <div><span className="text-zinc-500">Объект:</span> компьютерные игры как явление современной культуры</div>
              <div><span className="text-zinc-500">Предмет:</span> влияние на психологическое состояние, познавательные способности и социальное поведение</div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="bg-zinc-900 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-emerald-400 text-sm tracking-widest mb-1">ПОЗИТИВНОЕ ВЛИЯНИЕ</div>
              <h2 className="section-title text-4xl font-semibold tracking-tight">Польза компьютерных игр</h2>
            </div>
            <div className="hidden md:block text-sm text-emerald-400/70">Подтверждено исследованиями</div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POSITIVES.map((item, idx) => (
              <motion.div key={idx} whileHover={{ y: -3 }} className="card bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg mb-2 leading-tight">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 text-center text-xs text-zinc-500">По данным: APA, Newzoo, исследования Рочестерского университета и др.</div>
        </div>
      </section>

      {/* RISKS */}
      <section id="risks" className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-10">
          <div className="text-rose-400 text-sm tracking-widest mb-1">НЕГАТИВНОЕ ВЛИЯНИЕ</div>
          <h2 className="section-title text-4xl font-semibold tracking-tight">Риски компьютерных игр</h2>
          <p className="mt-3 max-w-xl text-zinc-400">Проблемы возникают преимущественно при чрезмерном и неконтролируемом использовании.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {NEGATIVES.map((item, idx) => (
            <div key={idx} className="card bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex gap-4">
              <div className="mt-1 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <item.icon className="w-4.5 h-4.5 text-rose-400" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1.5">{item.title}</h4>
                <p className="text-sm text-zinc-400 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HISTORY + CLASSIFICATION */}
      <section id="history" className="bg-zinc-900 py-16 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <h2 className="section-title text-4xl font-semibold tracking-tight mb-2">История и классификация</h2>
            <p className="text-zinc-400">Более 70 лет развития игровой индустрии</p>
          </div>

          {/* Timeline */}
          <div className="mb-14">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
              {HISTORY.map((item, index) => (
                <div key={index} className="timeline-item bg-zinc-950 rounded-2xl p-5 border border-zinc-800">
                  <div className="text-violet-400 text-sm font-medium mb-1">{item.year}</div>
                  <div className="font-semibold mb-2">{item.title}</div>
                  <div className="text-sm text-zinc-400">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-semibold">Классификация компьютерных игр</h3>
              <button onClick={() => setSelectedGenre(null)} className="text-xs px-3 py-1 text-zinc-400 hover:text-white">Сбросить фильтр</button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-5">
              {GENRES.map((g, i) => (
                <button 
                  key={i} 
                  onClick={() => setSelectedGenre(selectedGenre === g.name ? null : g.name)}
                  className={`text-sm px-4 py-1.5 rounded-full border transition ${selectedGenre === g.name ? 'bg-violet-600 border-violet-600' : 'border-zinc-700 hover:border-zinc-500'}`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGenres.map((genre, idx) => (
                <div key={idx} className={`card rounded-3xl p-6 border border-zinc-800 ${genre.color}`}>
                  <genre.icon className="w-6 h-6 mb-4" />
                  <div className="font-semibold text-lg mb-1.5">{genre.name}</div>
                  <p className="text-sm opacity-80">{genre.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AGE GROUPS */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight mb-8">Возрастные особенности воздействия</h2>
        <div className="space-y-3">
          {AGE_GROUPS.map((group, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-7 py-5 flex flex-col md:flex-row md:items-center gap-x-8 gap-y-1">
              <div className="font-medium md:w-72 text-white">{group.age}</div>
              <div className="text-sm px-4 py-1 bg-zinc-950 border border-zinc-800 rounded-full w-fit text-emerald-400">{group.time}</div>
              <div className="text-sm text-zinc-400 flex-1 md:pl-2">{group.tips}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RESULTS - SURVEY */}
      <section id="results" className="bg-zinc-900 py-16 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-9">
            <div>
              <div className="text-violet-400 tracking-[2px] text-xs mb-1">ПРАКТИЧЕСКОЕ ИССЛЕДОВАНИЕ</div>
              <h2 className="section-title text-4xl font-semibold tracking-tighter">Результаты онлайн-анкетирования</h2>
              <p className="text-zinc-400 mt-2">11 респондентов • Данные Google Формы + интерактивное обновление</p>
            </div>
            <button onClick={resetSurvey} className="flex items-center gap-2 text-sm px-4 h-10 rounded-xl border border-zinc-700 hover:bg-zinc-950 self-start">
              <RefreshCw size={15} /> Сбросить к исходным данным
            </button>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Играют каждый день</div>
              <div className="text-4xl font-semibold mt-1">{Math.round(surveyData.daily / surveyData.total * 100)}%</div>
              <div className="text-sm text-emerald-400">{surveyData.daily} из {surveyData.total}</div>
            </div>
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Снимают стресс</div>
              <div className="text-4xl font-semibold mt-1">81,8%</div>
              <div className="text-sm text-emerald-400">9 из 11 респондентов</div>
            </div>
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Не замечают вреда</div>
              <div className="text-4xl font-semibold mt-1">{Math.round(negativeData.no / (negativeData.no + negativeData.yes) * 100)}%</div>
              <div className="text-sm text-emerald-400">Однако 72,7% имеют проблемы со сном</div>
            </div>
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Проблемы со сном</div>
              <div className="text-4xl font-semibold mt-1">72,7%</div>
              <div className="text-sm text-amber-400">Иногда или регулярно</div>
            </div>
          </div>

          {/* CHARTS */}
          <div className="grid lg:grid-cols-2 gap-6 mb-9">
            {/* Frequency Bar */}
            <div className="chart-container p-6 border border-zinc-800 rounded-3xl">
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="font-medium">Частота игры в компьютерные игры</div>
                <div className="text-xs px-2.5 py-px bg-zinc-800 rounded">N = {surveyData.total}</div>
              </div>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={frequencyChartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#71717a' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#a78bfa" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Benefits Bar */}
            <div className="chart-container p-6 border border-zinc-800 rounded-3xl">
              <div className="font-medium mb-4 px-1">Положительные эффекты (выбрали несколько)</div>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={benefitsChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                    <XAxis type="number" tick={{ fill: '#71717a' }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 12 }} width={145} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#22c55e" radius={5} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Negative Pie */}
            <div className="chart-container p-6 border border-zinc-800 rounded-3xl">
              <div className="font-medium mb-4 px-1">Замечают ли респонденты отрицательное влияние?</div>
              <div className="h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={negativePieData} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius={95} label>
                      {negativePieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? POSITIVE_COLOR : NEGATIVE_COLOR} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sleep */}
            <div className="chart-container p-6 border border-zinc-800 rounded-3xl">
              <div className="font-medium mb-4 px-1">Проблемы со сном из-за игр</div>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={sleepChartData}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                    <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#71717a' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                    <Bar dataKey="value" fill="#f59e0b" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ANALYSIS TEXT + LIVE SURVEY */}
          <div className="mt-10 grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
              <div className="font-semibold mb-3">Анализ полученных данных</div>
              <div className="text-sm text-zinc-300 leading-relaxed space-y-3">
                <p>Компьютерные игры воспринимаются респондентами преимущественно как способ отдыха и развития отдельных навыков. 81,8% отмечают снятие стресса, 72,7% — развитие логического мышления.</p>
                <p>Однако 72,7% респондентов хотя бы иногда замечают проблемы со сном, если заигрываются допоздна. Несмотря на то что большинство не связывает игры с ухудшением учёбы напрямую, влияние на режим сна проявляется заметнее.</p>
                <p className="text-violet-300">Гипотеза подтвердилась частично: положительное влияние реально, но при длительных сессиях возможны негативные последствия.</p>
              </div>
            </div>

            {/* LIVE SURVEY FORM */}
            <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="text-violet-400" />
                <div className="font-semibold">Добавить свой ответ в опрос</div>
              </div>
              <p className="text-xs text-zinc-400 mb-5">Ваши ответы обновят диаграммы в реальном времени</p>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-xs mb-1.5 text-zinc-400">Как часто вы играете?</div>
                  <div className="grid grid-cols-2 gap-2">
                    {['daily', 'weekly1_2', 'weekly3_4', 'less'].map((val, i) => {
                      const labels = ['Каждый день', '1–2 раза в неделю', '3–4 раза в неделю', 'Реже'];
                      return (
                        <button key={val} onClick={() => setUserSurvey({...userSurvey, freq: val})} 
                          className={`quiz-option border border-zinc-700 px-3 py-2 rounded-xl text-left text-xs ${userSurvey.freq === val ? 'selected border-violet-500' : ''}`}>
                          {labels[i]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1.5 text-zinc-400">Игры помогают снимать стресс?</div>
                  <div className="flex gap-2">
                    {['yes', 'no'].map(v => (
                      <button key={v} onClick={() => setUserSurvey({...userSurvey, stress: v})} className={`flex-1 quiz-option border border-zinc-700 py-2 rounded-xl text-xs ${userSurvey.stress === v ? 'selected' : ''}`}>
                        {v === 'yes' ? 'Да' : 'Нет'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1.5 text-zinc-400">Проблемы со сном?</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['sometimes','regularly','never'].map((v,i) => (
                      <button key={i} onClick={() => setUserSurvey({...userSurvey, sleep: v})} className={`quiz-option border border-zinc-700 py-2 rounded-xl text-xs ${userSurvey.sleep === v ? 'selected' : ''}`}>
                        {i===0?'Иногда':i===1?'Регулярно':'Нет'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1.5 text-zinc-400">Замечаете отрицательное влияние?</div>
                  <div className="flex gap-2">
                    {['no','yes'].map(v => (
                      <button key={v} onClick={() => setUserSurvey({...userSurvey, negative: v})} className={`flex-1 quiz-option border border-zinc-700 py-2 rounded-xl text-xs ${userSurvey.negative === v ? 'selected' : ''}`}>
                        {v === 'no' ? 'Нет' : 'Да'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button onClick={submitUserSurvey} className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-sm font-medium transition">Добавить мой ответ</button>
                {hasAddedSurvey && <button onClick={resetSurvey} className="px-4 border border-zinc-700 rounded-2xl text-xs">Сбросить</button>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RECOMMENDATIONS */}
      <section id="recommendations" className="max-w-5xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-emerald-400 text-xs tracking-[2px]">ПРАКТИЧЕСКИЕ СОВЕТЫ</div>
            <h2 className="text-4xl font-semibold tracking-tight">Рекомендации по безопасному использованию</h2>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-4xl font-semibold tabular-nums">{progress}<span className="text-xl text-zinc-500">%</span></div>
            <div className="text-xs text-zinc-500 -mt-1">выполнено</div>
          </div>
        </div>

         <div className="bg-zinc-900 rounded-3xl p-2 border border-zinc-800 mb-6">
           {recommendations.map((rec) => (
             <div 
               key={rec.id} 
               onClick={() => toggleRecommendation(rec.id)}
               className={`recommendation-item flex gap-4 px-6 py-4 cursor-pointer rounded-2xl items-start hover:bg-zinc-950 ${rec.completed ? 'completed' : ''}`}
             >
              <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center border ${rec.completed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'}`}>
                {rec.completed && <CheckCircle size={15} className="text-white" />}
              </div>
              <div className="flex-1 text-[15px] leading-snug pr-4">{rec.text}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={downloadRecommendations} className="flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 rounded-2xl font-medium text-sm hover:bg-zinc-100">
            <Download size={16} /> Скачать рекомендации (.txt)
          </button>
          <button onClick={resetRecommendations} className="flex items-center gap-2 px-5 py-2.5 border border-zinc-700 rounded-2xl text-sm hover:bg-zinc-900">
            <RefreshCw size={16} /> Сбросить чек-лист
          </button>
          <button onClick={() => scrollTo('quiz')} className="flex items-center gap-2 px-5 py-2.5 border border-zinc-700 rounded-2xl text-sm hover:bg-zinc-900">
            <Target size={16} /> Пройти персональный тест
          </button>
        </div>
      </section>

      {/* QUIZ / SELF ASSESSMENT */}
      <section id="quiz" className="bg-zinc-900 py-16 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-9">
            <div className="inline-block px-4 py-1 text-xs tracking-widest rounded-full border border-violet-500/40 text-violet-400 mb-4">ИНТЕРАКТИВ</div>
            <h2 className="text-4xl font-semibold tracking-tighter">Тест: Какой у вас баланс в играх?</h2>
            <p className="text-zinc-400 mt-3">Ответьте на 5 вопросов и получите персональную оценку + советы</p>
          </div>

          <div className="max-w-2xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl p-8">
            {QUIZ_QUESTIONS.map((question, qIndex) => (
              <div key={qIndex} className="mb-8 last:mb-1">
                <div className="font-medium mb-3 text-sm tracking-tight">{qIndex + 1}. {question.q}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {question.options.map((option, aIndex) => (
                    <button 
                      key={aIndex} 
                      onClick={() => handleQuizAnswer(qIndex, aIndex)}
                      className={`quiz-option text-left border border-zinc-700 px-4 py-2.5 rounded-2xl text-sm ${quizAnswers.find(a => a.question === qIndex)?.answer === aIndex ? 'selected' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button 
              onClick={calculateQuizResult} 
              className="mt-3 w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-2xl font-medium flex justify-center items-center gap-2 transition-all active:scale-[0.985]"
            >
              Получить результат <Star size={18} />
            </button>
            <div className="text-center text-xs mt-3 text-zinc-500">Результаты анонимны и не сохраняются</div>
          </div>
        </div>
      </section>

      {/* SOURCES */}
      <section id="sources" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-semibold tracking-tight mb-7">Список литературы и источников</h2>
        <div className="grid gap-y-2 text-sm">
          {SOURCES.map((source, idx) => (
            <div key={idx} className="flex gap-3 text-zinc-400">
              <div className="text-zinc-600 tabular-nums w-4">{idx + 1}.</div>
              <div>{source}</div>
            </div>
          ))}
        </div>

        <div className="mt-9 pt-8 border-t border-zinc-800 text-xs text-zinc-500">
          Проект выполнен в рамках специальности 09.02.07 «Информационные системы и программирование».<br />
          Колледж экономики и информатики им. А.Н. Афанасьева, УлГТУ, Ульяновск, 2026.
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 py-9 text-xs text-zinc-500 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-y-2">
          <div>«Влияние компьютерных игр» — индивидуальный проект. Все права на материалы сохранены.</div>
          <div>Сайт создан на React + Vite + Tailwind • Для образовательных целей</div>
        </div>
      </footer>

      {/* QUIZ RESULT MODAL */}
      <AnimatePresence>
        {showQuizModal && quizResult && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-5" onClick={closeQuizModal}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-700 rounded-3xl max-w-md w-full p-8"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="font-semibold">Ваш результат</div>
                <button onClick={closeQuizModal} className="text-zinc-400"><X size={20} /></button>
              </div>

              <div className="text-center py-2">
                <div className="text-[72px] leading-none font-semibold tabular-nums tracking-[-3.5px] mb-1 text-white">{quizResult.score}</div>
                <div className="text-violet-400 text-sm -mt-1">из 100 • баланс игры и жизни</div>
              </div>

              <div className="text-center mt-5">
                <div className="text-xl font-semibold mb-2">{quizResult.message}</div>
                <p className="text-zinc-300 leading-relaxed text-[15px]">{quizResult.advice}</p>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => { closeQuizModal(); scrollTo('recommendations'); }} className="flex-1 py-3 bg-white text-zinc-950 rounded-2xl text-sm font-medium">Перейти к рекомендациям</button>
                <button onClick={closeQuizModal} className="flex-1 py-3 border border-zinc-700 rounded-2xl text-sm">Закрыть</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
