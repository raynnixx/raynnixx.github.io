import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Brain, Eye, Clock, Users, Heart, AlertTriangle, CheckCircle, 
  Target, BookOpen, BarChart3, Award, ArrowRight, Menu, X, 
  RefreshCw, Star, TrendingUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs
} from "firebase/firestore";

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

interface QuizResult {
  score: number;
  message: string;
  advice: string;
  recommendations: string[];
}

interface SurveyResponse {
  id: string;
  createdAt: string;
  freq: string;
  benefits: string[];
  sleep: string;
  negative: string;
}

const POSITIVE_COLOR = '#22c55e';
const NEGATIVE_COLOR = '#ef4444';
const ADMIN_PASSWORD = 'admin2026';
const SURVEY_STORAGE_KEY = 'gameSurveyResponses';

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

// Benefit options for the survey (index matches INITIAL_BENEFITS)
const BENEFIT_OPTIONS = [
  { key: 'stress', label: 'Снятие стресса и отдых' },
  { key: 'logic', label: 'Развитие логического мышления' },
  { key: 'reaction', label: 'Улучшение реакции и внимания' },
  { key: 'team', label: 'Развитие командной работы' },
  { key: 'english', label: 'Изучение английского' },
  { key: 'creativity', label: 'Креативность и творчество' },
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
  {
    name: 'Экшен (Action)',
    icon: Target,
    desc: 'Динамичные игры, где важны скорость реакции, точность и быстрые решения.',
    color: 'bg-red-500/10 text-red-400',
    develops: 'реакцию, внимание, координацию глаз–рука',
    watch: 'эмоциональное возбуждение, усталость глаз и агрессию после долгих сессий',
    choose: 'лучше выбирать игры с понятным рейтингом и без чрезмерного насилия',
    examples: 'шутеры, файтинги, аркады',
  },
  {
    name: 'RPG',
    icon: Award,
    desc: 'Игры с развитием персонажа, сюжетом, выбором решений и выполнением заданий.',
    color: 'bg-purple-500/10 text-purple-400',
    develops: 'чтение, погружение в сюжет, принятие решений и планирование развития персонажа',
    watch: 'слишком долгие игровые сессии из-за большого количества заданий',
    choose: 'обращайте внимание на сюжет, возрастной рейтинг и наличие доната',
    examples: 'сюжетные RPG, MMORPG, приключенческие RPG',
  },
  {
    name: 'Стратегии',
    icon: Brain,
    desc: 'Игры, где нужно планировать, распределять ресурсы и думать на несколько ходов вперед.',
    color: 'bg-blue-500/10 text-blue-400',
    develops: 'логическое мышление, планирование, анализ ошибок и терпение',
    watch: 'перегрузку внимания и желание «доиграть еще один раунд»',
    choose: 'хорошо подходят стратегии без агрессивного темпа и с обучающим режимом',
    examples: 'RTS, пошаговые стратегии, градостроительные стратегии',
  },
  {
    name: 'Симуляторы',
    icon: Gamepad2,
    desc: 'Игры, которые имитируют реальные процессы: управление, спорт, транспорт или профессию.',
    color: 'bg-emerald-500/10 text-emerald-400',
    develops: 'понимание систем, аккуратность, концентрацию и интерес к профессиям',
    watch: 'монотонность и длительное сидение без перерывов',
    choose: 'полезны реалистичные симуляторы с понятными целями и режимом обучения',
    examples: 'авто-, авиа-, спортивные и экономические симуляторы',
  },
  {
    name: 'Песочницы',
    icon: Star,
    desc: 'Игры со свободой действий, строительством, созданием миров и собственных правил.',
    color: 'bg-amber-500/10 text-amber-400',
    develops: 'креативность, пространственное мышление, проектирование и командную работу',
    watch: 'потерю времени из-за отсутствия четкого финала',
    choose: 'лучше выбирать безопасные серверы и настройки приватности',
    examples: 'Minecraft, Roblox, Terraria, творческие режимы',
  },
  {
    name: 'Хорроры',
    icon: AlertTriangle,
    desc: 'Игры, построенные на напряжении, страхе, неожиданностях и тревожной атмосфере.',
    color: 'bg-zinc-500/10 text-zinc-400',
    develops: 'внимательность и умение действовать в напряженной ситуации',
    watch: 'тревожность, плохой сон и сильные эмоции после игры',
    choose: 'не стоит играть детям младшего возраста и перед сном',
    examples: 'survival horror, психологические хорроры, квесты с напряжением',
  },
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
  { id: 7, text: 'Выбирать игры осознанно — отдавать предпочтение развивающим играм', completed: false },
  { id: 8, text: 'Не заменять реальное общение виртуальным', completed: false },
  { id: 9, text: 'Контролировать эмоциональное состояние — при раздражительности делать перерыв', completed: false },
  { id: 10, text: 'Использовать игры как отдых, а не как основное занятие', completed: false },
];

const TEEN_RECOMMENDATIONS = [
  'Ставь таймер до начала игры, а не после того, как уже заигрался.',
  'Сначала учеба и важные дела, потом игровая сессия как награда.',
  'После 30–45 минут делай короткий перерыв: глаза, вода, разминка.',
  'Не начинай онлайн-матч, если до сна осталось меньше часа.',
];

const PARENT_RECOMMENDATIONS = [
  'Обсуждайте правила заранее: сколько играть, во что играть и когда заканчивать.',
  'Смотрите возрастной рейтинг и содержание игры, а не только популярность.',
  'Не запрещайте резко без объяснений: лучше договориться о понятном режиме.',
  'Обращайте внимание на сон, настроение, учебу и замену реального общения играми.',
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
  const [userSurvey, setUserSurvey] = useState<{
    freq: string;
    benefits: string[];
    sleep: string;
    negative: string;
  }>({
    freq: '',
    benefits: [],
    sleep: '',
    negative: '',
  });
  const [hasAddedSurvey, setHasAddedSurvey] = useState(false);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Recommendations checklist with persistence
  const [recommendations, setRecommendations] = useState<RecItem[]>(BASE_RECOMMENDATIONS);
  const [progress, setProgress] = useState(0);

  // Self-assessment quiz
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
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

useEffect(() => {
  loadSurveyResponses();
}, []);

  // Hidden admin access: open the panel only via the secret URL hash (#admin-2026)
  useEffect(() => {
    const checkAdminHash = () => {
      const hash = decodeURIComponent(window.location.hash);
      if (hash === '#admin-2026') {
        setShowAdminPanel(true);
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);
    return () => window.removeEventListener('hashchange', checkAdminHash);
  }, []);

  // Dynamic analysis text generation
  const getDynamicAnalysis = () => {
    const total = surveyData.total;
    const stressReliefPercent = Math.round((benefitsData[0].value / total) * 100);
    const logicPercent = Math.round((benefitsData[1].value / total) * 100);
    const sleepIssuesPercent = Math.round(((sleepData[0].value + sleepData[1].value) / total) * 100);
    const noNegativePercent = Math.round((negativeData.no / total) * 100);

    return (
      <div className="text-sm text-zinc-300 leading-relaxed space-y-3">
        <p>
          Компьютерные игры воспринимаются респондентами преимущественно как способ отдыха и развития отдельных навыков. 
          <span className="text-white font-medium"> {stressReliefPercent}%</span> отмечают снятие стресса, 
           а <span className="text-white font-medium"> {logicPercent}%</span> — развитие логического мышления.
        </p>
        <p>
          Однако <span className="text-white font-medium">{sleepIssuesPercent}%</span> респондентов хотя бы иногда замечают проблемы со сном, если заигрываются допоздна. 
          {noNegativePercent > 60 
            ? " Несмотря на то что большинство не замечает явного отрицательного влияния, проблемы с режимом дня остаются наиболее заметным риском."
            : " Значительная часть опрошенных также отмечает негативное влияние игр на продуктивность или самочувствие."
          }
        </p>
        <p className="text-violet-300">
          {sleepIssuesPercent > 50 || noNegativePercent < 70 
            ? "Гипотеза подтвердилась частично: положительное влияние реально, но при отсутствии контроля риски для здоровья становятся существенными."
            : "Данные подтверждают умеренно-позитивное влияние игр при сохранении баланса."
          }
        </p>
      </div>
    );
  };

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
    setIsMenuOpen(false);
    window.setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offsetPosition = element.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    }, isMenuOpen ? 80 : 0);
  };

  const applySurveyResponses = (responses: SurveyResponse[]) => {
    const nextSurvey = { ...INITIAL_SURVEY };
    const nextBenefits = INITIAL_BENEFITS.map((item) => ({ ...item }));
    const nextNegative = { ...INITIAL_NEGATIVE };
    const nextSleep = SLEEP_DATA.map((item) => ({ ...item }));

    responses.forEach((response) => {
      if (response.freq === 'daily') nextSurvey.daily++;
      else if (response.freq === 'weekly1_2') nextSurvey.weekly1_2++;
      else if (response.freq === 'weekly3_4') nextSurvey.weekly3_4++;
      else nextSurvey.less++;
      nextSurvey.total++;

      (response.benefits ?? []).forEach((benefitKey) => {
        const benefitIndex = BENEFIT_OPTIONS.findIndex((option) => option.key === benefitKey);
        if (benefitIndex !== -1) nextBenefits[benefitIndex].value++;
      });

      if (response.negative === 'no') nextNegative.no++;
      else nextNegative.yes++;

      if (response.sleep === 'sometimes') nextSleep[0].value++;
      else if (response.sleep === 'regularly') nextSleep[1].value++;
      else nextSleep[2].value++;
    });

    setSurveyData(nextSurvey);
    setBenefitsData(nextBenefits);
    setNegativeData(nextNegative);
    setSleepData(nextSleep);
  };
const loadSurveyResponses = async () => {
  const snapshot = await getDocs(
    collection(db, "surveyResponses")
  );

  const responses = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SurveyResponse[];

  setSurveyResponses(responses);
  applySurveyResponses(responses);
};

  const saveSurveyResponses = (responses: SurveyResponse[]) => {
    setSurveyResponses(responses);
    applySurveyResponses(responses);
  };

  const formatSurveyAnswer = (response: SurveyResponse) => {
    const freqLabels: Record<string, string> = {
      daily: 'Каждый день',
      weekly1_2: '1-2 раза в неделю',
      weekly3_4: '3-4 раза в неделю',
      less: 'Реже',
    };
    const sleepLabels: Record<string, string> = {
      sometimes: 'Иногда',
      regularly: 'Регулярно',
      never: 'Нет',
    };

    const benefitLabels = (response.benefits ?? [])
      .map((key) => BENEFIT_OPTIONS.find((option) => option.key === key)?.label)
      .filter(Boolean)
      .join(', ');

    return `Частота: ${freqLabels[response.freq] ?? response.freq}; польза: ${benefitLabels || 'не отмечено'}; сон: ${sleepLabels[response.sleep] ?? response.sleep}; вред: ${response.negative === 'yes' ? 'замечает' : 'не замечает'}`;
  };

  // Interactive: Add user survey response
  const submitUserSurvey = async () => {
    if (!userSurvey.freq || !userSurvey.sleep || !userSurvey.negative) {
      alert('Пожалуйста, ответьте на все вопросы анкеты');
      return;
    }

    const nextResponse: SurveyResponse = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...userSurvey,
    };

    await addDoc(
  collection(db, "surveyResponses"),
  nextResponse
);

loadSurveyResponses();

    setHasAddedSurvey(true);
    // Reset form
    setUserSurvey({ freq: '', benefits: [], sleep: '', negative: '' });

    // Show success message
    setTimeout(() => {
      alert('Спасибо! Ваш ответ добавлен в общую статистику.');
    }, 300);
  };

  const resetSurvey = () => {
    saveSurveyResponses([]);
    setHasAddedSurvey(false);
    setUserSurvey({ freq: '', benefits: [], sleep: '', negative: '' });
  };

  const toggleBenefit = (key: string) => {
    setUserSurvey((prev) => ({
      ...prev,
      benefits: prev.benefits.includes(key)
        ? prev.benefits.filter((item) => item !== key)
        : [...prev.benefits, key],
    }));
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

    const answerByQuestion = (question: number) => quizAnswers.find((answer) => answer.question === question)?.answer ?? 0;
    const personalRecommendations: string[] = [];

    if (answerByQuestion(0) >= 1) {
      personalRecommendations.push(answerByQuestion(0) === 0 ? 'Сохраняйте текущую частоту игр, если она не мешает учебе и сну.' : 'Выделите 1–2 дня в неделю без игр, чтобы режим отдыха не зависел только от компьютера.');
    }
    if (answerByQuestion(1) >= 2) {
      personalRecommendations.push('Сократите одну игровую сессию до 60–90 минут и поставьте таймер до запуска игры.');
    } else {
      personalRecommendations.push('Оставьте игровые сессии короткими: так легче сохранить концентрацию и не уставать.');
    }
    if (answerByQuestion(2) >= 1) {
      personalRecommendations.push('Заканчивайте игры минимум за час до сна. Если играете онлайн, не начинайте новый матч поздно вечером.');
    }
    if (answerByQuestion(3) >= 2) {
      personalRecommendations.push('Используйте правило: сначала учеба и обязательные дела, потом игра как награда.');
    }
    if (answerByQuestion(4) >= 2) {
      personalRecommendations.push('Добавьте обязательные перерывы: 5–10 минут отдыха для глаз и разминки после каждых 30–45 минут.');
    }
    if (personalRecommendations.length < 3) {
      personalRecommendations.push('Периодически проверяйте себя: сон, настроение, учеба и общение важнее игрового прогресса.');
    }

    setQuizResult({ score: balanceScore, message, advice, recommendations: personalRecommendations });
    setShowQuizModal(true);
    setQuizAnswers([]); // reset for next time
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
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

  const activeGenre = GENRES.find((genre) => genre.name === selectedGenre) ?? GENRES[0];

  const navItems = [
    { label: 'О сайте', id: 'about' },
    { label: 'Польза', id: 'benefits' },
    { label: 'Риски', id: 'risks' },
    { label: 'История и классификация', id: 'history' },
    { label: 'Результаты опроса', id: 'results' },
    { label: 'Тест', id: 'quiz' },
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
              <div className="text-[10px] text-zinc-500 -mt-1">Гид по безопасному геймингу</div>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6 text-sm">
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
            className="lg:hidden p-2 text-zinc-400 hover:text-white"
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
              className="lg:hidden border-t border-zinc-800 bg-zinc-950 px-6 py-4 flex flex-col gap-3 text-sm"
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
      <section id="hero" className="relative overflow-hidden pt-16 pb-20 bg-[radial-gradient(#27272a_0.8px,transparent_1px)] bg-[length:4px_4px]">
        {/* Анимированные фоновые элементы */}
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />
        <div className="absolute -right-20 top-1/2 h-64 w-64 rounded-full bg-indigo-600/10 blur-[100px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center relative z-10"
        >
          <h1 className="text-6xl md:text-7xl font-semibold tracking-tighter leading-[1.05] mb-6">
            Компьютерные игры:<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">польза и риски</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-zinc-400 mb-10">
            Понятный гид о пользе, рисках и правилах безопасного гейминга.<br />Для подростков, родителей и педагогов.
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
            <div><span className="font-semibold text-2xl text-white">{surveyData.total}</span><div className="text-zinc-500">респондентов в опросе</div></div>
            <div><span className="font-semibold text-2xl text-white">{((benefitsData[0].value / surveyData.total) * 100).toFixed(1).replace('.0', '')}%</span><div className="text-zinc-500">отмечают пользу</div></div>
          </div>
        </motion.div>
      </section>

      {/* ABOUT */}
      <section id="about" className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-800">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-5 gap-12"
        >
          <div className="md:col-span-2">
            <div className="uppercase text-xs tracking-[3px] text-violet-400 mb-3">ИНФОРМАЦИОННЫЙ САЙТ</div>
            <h2 className="section-title text-4xl font-semibold tracking-tighter">О сайте</h2>
          </div>
          <div className="md:col-span-3 space-y-6 text-lg text-zinc-300">
            <p>
              <strong>Главная идея:</strong> показать, что компьютерные игры не являются однозначно вредными или полезными. Важно понимать жанр, время игры, возрастные ограничения и влияние на сон, учёбу и самочувствие.
            </p>
            <div>
              <p className="font-medium mb-2 text-white">Что можно сделать на сайте:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-base">
                <li>Разобраться в пользе и рисках компьютерных игр</li>
                <li>Посмотреть результаты небольшого опроса</li>
                <li>Сравнить жанры и понять, какие навыки они развивают</li>
                <li>Пройти тест и получить персональные рекомендации</li>
                <li>Скачать советы для себя или родителей</li>
              </ul>
            </div>
            <div className="pt-2 flex flex-wrap gap-x-10 gap-y-1 text-sm">
              <div><span className="text-zinc-500">Для кого:</span> подростки, родители и педагоги</div>
              <div><span className="text-zinc-500">Формат:</span> короткие объяснения, диаграммы, тест и практические советы</div>
            </div>
          </div>
        </motion.div>
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
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -3 }} 
                className="card bg-zinc-950 border border-zinc-800 rounded-3xl p-6"
              >
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {HISTORY.map((item, index) => (
                <div key={index} className="timeline-item relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-400 border border-violet-500/20">
                      {item.year}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-white tracking-tight leading-snug">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950/70 p-6 md:p-8">
            <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs tracking-[2px] text-violet-400">КАК ВЫБРАТЬ ИГРУ</div>
                <h3 className="mt-1 text-2xl font-semibold tracking-tight">Жанры и их влияние</h3>
                <p className="mt-2 max-w-xl text-sm text-zinc-400">
                  Жанр влияет на то, какие навыки тренируются и какие риски могут появиться при долгой игре.
                </p>
              </div>
              <button onClick={() => setSelectedGenre(null)} className="w-fit rounded-full border border-zinc-700 px-4 py-2 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-white">
                Показать первый жанр
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {GENRES.map((genre) => {
                  const isActive = activeGenre.name === genre.name;
                  return (
                    <button
                      key={genre.name}
                      onClick={() => setSelectedGenre(genre.name)}
                      className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${isActive ? 'border-violet-500 bg-violet-500/10 text-white' : 'border-zinc-800 bg-zinc-900/70 text-zinc-400 hover:border-zinc-600 hover:text-white'}`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-violet-500 text-white' : 'bg-zinc-950 text-zinc-500 group-hover:text-violet-300'}`}>
                        <genre.icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{genre.name}</span>
                        <span className="block text-xs text-zinc-500">Нажмите, чтобы раскрыть</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative overflow-hidden rounded-[1.7rem] border border-zinc-800 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.18),transparent_38%),#18181b] p-7 md:p-8">
                <div className="absolute right-6 top-6 text-[120px] text-white/[0.03]">
                  <activeGenre.icon className="h-28 w-28" />
                </div>
                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                    <activeGenre.icon className="h-7 w-7" />
                  </div>
                  <h4 className="text-3xl font-semibold tracking-tight text-white">{activeGenre.name}</h4>
                  <p className="mt-3 max-w-2xl text-zinc-300">{activeGenre.desc}</p>
                  <div className="mt-4 inline-flex rounded-full border border-zinc-800 bg-zinc-950/70 px-4 py-1.5 text-xs text-zinc-400">
                    Примеры: {activeGenre.examples}
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <div className="mb-1 text-xs uppercase tracking-[2px] text-emerald-400">Развивает</div>
                      <div className="text-sm text-zinc-300">{activeGenre.develops}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <div className="mb-1 text-xs uppercase tracking-[2px] text-amber-400">Следить</div>
                      <div className="text-sm text-zinc-300">{activeGenre.watch}</div>
                    </div>
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                      <div className="mb-1 text-xs uppercase tracking-[2px] text-violet-400">Выбор</div>
                      <div className="text-sm text-zinc-300">{activeGenre.choose}</div>
                    </div>
                  </div>
                </div>
              </div>
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
              <p className="text-zinc-400 mt-2">{surveyData.total} респондентов • Данные опроса в реальном времени</p>
            </div>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Играют каждый день</div>
              <div className="text-4xl font-semibold mt-1">{Math.round((surveyData.daily / surveyData.total) * 100)}%</div>
              <div className="text-sm text-emerald-400">{surveyData.daily} из {surveyData.total}</div>
            </div>
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Снимают стресс</div>
              <div className="text-4xl font-semibold mt-1">{Math.round((benefitsData[0].value / surveyData.total) * 100)}%</div>
              <div className="text-sm text-emerald-400">{benefitsData[0].value} из {surveyData.total} респондентов</div>
            </div>
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Не замечают вреда</div>
              <div className="text-4xl font-semibold mt-1">{Math.round((negativeData.no / (negativeData.no + negativeData.yes)) * 100)}%</div>
              <div className="text-sm text-emerald-400">Однако {Math.round(((sleepData[0].value + sleepData[1].value) / surveyData.total) * 100)}% имеют проблемы со сном</div>
            </div>
            <div className="stat-card rounded-3xl p-5">
              <div className="text-xs text-zinc-500">Проблемы со сном</div>
              <div className="text-4xl font-semibold mt-1">{Math.round(((sleepData[0].value + sleepData[1].value) / surveyData.total) * 100)}%</div>
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
              <div className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={18} className="text-violet-400" />
                Анализ полученных данных
              </div>
              {getDynamicAnalysis()}
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
                  <div className="text-xs mb-1.5 text-zinc-400">1. Как часто вы играете?</div>
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
                  <div className="text-xs mb-1.5 text-zinc-400">2. Какую пользу от игр вы замечаете? (можно несколько)</div>
                  <div className="grid grid-cols-1 gap-2">
                    {BENEFIT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => toggleBenefit(option.key)}
                        className={`quiz-option border border-zinc-700 px-3 py-2 rounded-xl text-left text-xs flex items-center gap-2 ${userSurvey.benefits.includes(option.key) ? 'selected border-violet-500' : ''}`}
                      >
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${userSurvey.benefits.includes(option.key) ? 'border-violet-400 bg-violet-500' : 'border-zinc-600'}`}>
                          {userSurvey.benefits.includes(option.key) && <CheckCircle size={11} className="text-white" />}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1.5 text-zinc-400">3. Бывают ли проблемы со сном из-за игр?</div>
                  <div className="grid grid-cols-3 gap-2">
                    {['sometimes','regularly','never'].map((v,i) => (
                      <button key={i} onClick={() => setUserSurvey({...userSurvey, sleep: v})} className={`quiz-option border border-zinc-700 py-2 rounded-xl text-xs ${userSurvey.sleep === v ? 'selected' : ''}`}>
                        {i===0?'Иногда':i===1?'Регулярно':'Нет'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1.5 text-zinc-400">4. Замечаете ли отрицательное влияние игр?</div>
                  <div className="flex gap-2">
                    {['no','yes'].map(v => (
                      <button key={v} onClick={() => setUserSurvey({...userSurvey, negative: v})} className={`flex-1 quiz-option border border-zinc-700 py-2 rounded-xl text-xs ${userSurvey.negative === v ? 'selected' : ''}`}>
                        {v === 'no' ? 'Нет' : 'Да'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <button onClick={submitUserSurvey} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 rounded-2xl text-sm font-medium transition">Добавить мой ответ</button>
              </div>
              <div className="mt-3 text-xs text-zinc-500">
                {hasAddedSurvey ? 'Спасибо! Ваш ответ учтён в диаграммах выше.' : 'Ваши ответы обновят все диаграммы и проценты на этой странице.'}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* HIDDEN ADMIN PANEL — открывается только по секретной ссылке #admin-2026 */}
      {showAdminPanel && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/80 p-4 sm:p-8">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 my-8">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-white">Панель автора</div>
                <div className="text-xs text-zinc-500">Управление сохранёнными ответами опроса. Доступ только у автора сайта.</div>
              </div>
              <button
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  setAdminPassword('');
                  window.history.replaceState(null, '', window.location.pathname + window.location.search);
                  setShowAdminPanel(false);
                }}
                className="rounded-xl border border-zinc-700 p-2 text-zinc-400 hover:bg-zinc-900"
              >
                <X size={18} />
              </button>
            </div>

            {!isAdminAuthenticated ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(event) => setAdminPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      if (adminPassword === ADMIN_PASSWORD) {
                        setIsAdminAuthenticated(true);
                        setAdminPassword('');
                      } else {
                        alert('Неверный пароль');
                      }
                    }
                  }}
                  placeholder="Пароль автора"
                  className="min-w-0 flex-1 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                />
                <button
                  onClick={() => {
                    if (adminPassword === ADMIN_PASSWORD) {
                      setIsAdminAuthenticated(true);
                      setAdminPassword('');
                    } else {
                      alert('Неверный пароль');
                    }
                  }}
                  className="rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500"
                >
                  Войти
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-zinc-500">Сохранено ответов: {surveyResponses.length}</div>
                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
                  {surveyResponses.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">Пока нет сохранённых ответов.</div>
                  ) : (
                    surveyResponses.map((response, index) => (
                      <div key={response.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">Ответ #{index + 1}</div>
                          <div className="text-xs text-zinc-400">{formatSurveyAnswer(response)}</div>
                          <div className="mt-1 text-[11px] text-zinc-600">{new Date(response.createdAt).toLocaleString('ru-RU')}</div>
                        </div>
                        <button
                          onClick={() => saveSurveyResponses(surveyResponses.filter((item) => item.id !== response.id))}
                          className="rounded-xl border border-rose-500/40 px-4 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                        >
                          Удалить
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {surveyResponses.length > 0 && (
                  <button onClick={resetSurvey} className="rounded-2xl border border-zinc-700 px-5 py-2.5 text-sm hover:bg-zinc-900">
                    Удалить все сохранённые ответы
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
            <div className="text-center text-xs mt-3 text-zinc-500">После отправки вы сразу увидите персональные рекомендации</div>
          </div>
        </div>
      </section>

      {/* RECOMMENDATIONS */}
      <section id="recommendations" className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-8">
          <div className="text-emerald-400 text-xs tracking-[2px]">РЕЗУЛЬТАТ ТЕСТА</div>
          <h2 className="text-4xl font-semibold tracking-tight">Персональные рекомендации</h2>
          <p className="mt-2 max-w-2xl text-zinc-400">
            Этот блок заполняется после теста выше: сайт смотрит на ваши ответы и показывает конкретные действия, а не общий список советов.
          </p>
        </div>

        <div className="mb-8 rounded-[2rem] border border-zinc-800 bg-zinc-900 p-7">
          {quizResult ? (
            <div className="grid gap-7 md:grid-cols-[220px_1fr] md:items-start">
              <div>
                <div className="text-xs text-zinc-500">Ваш баланс</div>
                <div className="text-6xl font-semibold leading-none tracking-[-3px] text-white">{quizResult.score}</div>
                <div className="mt-1 text-sm text-violet-400">из 100</div>
                <div className="mt-4 font-semibold">{quizResult.message}</div>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{quizResult.advice}</p>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
                  <Target className="h-4 w-4 text-emerald-400" />
                  Что стоит изменить в первую очередь
                </div>
                <div className="space-y-3">
                  {quizResult.recommendations.map((item, index) => (
                    <div key={index} className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-2 text-xl font-semibold text-white">Сначала пройдите тест</div>
                <p className="max-w-2xl text-zinc-400">
                  Персональные рекомендации появятся здесь сразу после ответа на 5 вопросов. Так советы будут привязаны к вашему времени игры, сну, учебе и самочувствию.
                </p>
              </div>
              <button onClick={() => scrollTo('quiz')} className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-500">
                Перейти к тесту
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Gamepad2 className="h-5 w-5 text-violet-400" />
              Советы подросткам
            </div>
            <div className="space-y-3 text-sm text-zinc-300">
              {TEEN_RECOMMENDATIONS.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Users className="h-5 w-5 text-emerald-400" />
              Советы родителям
            </div>
            <div className="space-y-3 text-sm text-zinc-300">
              {PARENT_RECOMMENDATIONS.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-white">Базовый чек-лист привычек</div>
              <div className="text-xs text-zinc-500">Можно отмечать пункты, которые уже выполняются</div>
            </div>
            <div className="text-right text-sm text-zinc-400"><span className="text-xl font-semibold text-white">{progress}%</span><br />готово</div>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {recommendations.slice(0, 6).map((rec) => (
              <button
                key={rec.id}
                onClick={() => toggleRecommendation(rec.id)}
                className={`recommendation-item flex gap-3 rounded-2xl px-4 py-3 text-left text-sm hover:bg-zinc-950 ${rec.completed ? 'completed text-zinc-500' : 'text-zinc-300'}`}
              >
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${rec.completed ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`}>
                  {rec.completed && <CheckCircle size={13} className="text-white" />}
                </span>
                <span>{rec.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={resetRecommendations} className="flex items-center gap-2 rounded-2xl border border-zinc-700 px-5 py-2.5 text-sm hover:bg-zinc-900">
            <RefreshCw size={16} /> Сбросить базовый чек-лист ({progress}%)
          </button>
        </div>
      </section>

      {/* SOURCES AND FINAL */}
      <section id="sources" className="bg-zinc-950 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12 flex h-px w-full bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-2">
              <div className="text-violet-400 text-xs tracking-[2px] mb-2">ГЛАВНЫЙ ВЫВОД</div>
              <h2 className="text-4xl font-semibold tracking-tighter mb-5">Заключение</h2>
              <p className="text-zinc-300 leading-relaxed mb-6">
                Компьютерные игры могут приносить пользу: развивать внимание, реакцию, логику и помогать отдыхать. Однако при длительных игровых сессиях и игре допоздна появляются риски для сна, здоровья и учебной продуктивности.
              </p>
              <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="font-semibold mb-4">Итоговая рекомендация</div>
                <div className="space-y-3 text-sm text-zinc-300">
                  <div className="flex gap-3"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />Игры стоит использовать как отдых, а не как основное занятие.</div>
                  <div className="flex gap-3"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />Важно соблюдать лимит времени, делать перерывы и не играть перед сном.</div>
                  <div className="flex gap-3"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />Родителям и подросткам полезно обсуждать выбор игр и режим дня.</div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => scrollTo('recommendations')} className="px-5 py-2.5 bg-white text-zinc-950 rounded-2xl text-sm font-medium hover:bg-zinc-100">
                  Открыть рекомендации
                </button>
                <button onClick={() => scrollTo('hero')} className="px-5 py-2.5 border border-zinc-700 rounded-2xl text-sm hover:bg-zinc-900">
                  Вернуться наверх
                </button>
              </div>
            </div>

            <div className="lg:col-span-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-7">
              <h3 className="text-2xl font-semibold tracking-tight mb-5">Список литературы и источников</h3>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {SOURCES.map((source, idx) => (
                  <div key={idx} className="flex gap-3 text-zinc-400 leading-relaxed">
                    <div className="text-violet-400/70 tabular-nums w-5 shrink-0">{idx + 1}.</div>
                    <div>{source}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Компьютерные игры: польза и риски</div>
                <div className="text-xs text-zinc-500">Информационный сайт о безопасном гейминге</div>
              </div>
            </div>

            <div className="text-left text-xs leading-relaxed text-zinc-500 md:text-right">
              Польза, риски, результаты опроса и практические рекомендации<br />
              для подростков, родителей и педагогов<br />
              Обновлено: 2026
            </div>
          </div>
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

              <div className="mt-6 space-y-2 text-sm">
                <div className="font-medium text-white">Что сделать в первую очередь:</div>
                {quizResult.recommendations.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex gap-2 rounded-2xl bg-zinc-950 px-3 py-2 text-left text-zinc-300">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{item}</span>
                  </div>
                ))}
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
