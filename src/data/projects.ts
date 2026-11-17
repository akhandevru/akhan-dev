import type { ImageMetadata } from 'astro';
import komnata from '../assets/projects/komnata.png';
import kontur from '../assets/projects/kontur.png';
import gran from '../assets/projects/gran.png';
import list from '../assets/projects/list.png';
import shov from '../assets/projects/shov.png';
import umlaut from '../assets/projects/umlaut.png';
import socvetie from '../assets/projects/socvetie.png';
import poltarelki from '../assets/projects/poltarelki.png';
import yarus from '../assets/projects/yarus.png';

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  technologies: string[];
  image: ImageMetadata;
  previewLabel: string;
  demo: string;
  year: string;
  scope: string[];
  /** Цвет карточки проекта и признак тёмного фона (текст светлый). */
  tone: string;
  dark: boolean;
}

/** Демонстрационные интерфейсы. Названия компаний, адреса и контакты вымышлены. */
export const projects: Project[] = [
  {
    id: 'yarus', name: 'Ярус', category: 'Жилой комплекс',
    description: 'Сайт премиального квартала в сумерках: гигантское слово за силуэтом города, светлый каталог с карточками квартир, ипотечный калькулятор и запись на показ.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: yarus,
    previewLabel: 'yarus.example', demo: '/demos/yarus/index.html', year: '2026',
    scope: ['Слоистый первый экран с параллаксом на CSS', 'Шахматка квартир с фильтрами и планировками', 'Ипотека по трём программам и запись на показ'],

    tone: '#0b1020', dark: true,
  },
  {
    id: 'poltarelki', name: 'Полтарелки', category: 'Доставка здоровой еды',
    description: 'Сервис доставки по всей России в контрастном зелёном и белом. Срок и цена по городу, расчёт рациона по калориям и оформление заказа.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: poltarelki,
    previewLabel: 'poltarelki.example', demo: '/demos/poltarelki/index.html', year: '2026',
    scope: ['Срок и цена доставки от ближайшей кухни', 'Расчёт нормы калорий и цены рациона', 'Меню с фильтрами и составом блюд'],

    tone: '#25252a', dark: true,
  },
  {
    id: 'socvetie', name: 'Соцветие', category: 'Цветочный магазин',
    description: 'Магазин в пастельных тонах со своей страницей и цветом для каждого букета. Конструктор букета, атлас-книга и заказ в два касания.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: socvetie,
    previewLabel: 'socvetie.example', demo: '/demos/socvetie/index.html', year: '2026',
    scope: ['Конструктор: букет меняется с каждым стеблем', 'Атлас цветов, который листается как книга', 'Каталог и заказ в два касания'],

    tone: '#e4e4e1', dark: false,
  },
  {
    id: 'umlaut', name: 'Умлаут', category: 'Онлайн-школа языков',
    description: 'Сайт школы, где выбранный язык перекрашивает все страницы. Тест уровня с разбором ответов, калькулятор курса, преподаватели и отзывы.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: umlaut,
    previewLabel: 'umlaut.example', demo: '/demos/umlaut/index.html', year: '2026',
    scope: ['Тест на 4 языках с уровнем и разбором', 'Пересчёт цены курса по шести параметрам', 'Фильтры преподавателей и отзывов'],

    tone: '#f5f5f3', dark: false,
  },
  {
    id: 'shov', name: 'Шов', category: 'Магазин одежды и обуви',
    description: 'Интернет-магазин с каталогом, выбором размера, корзиной и оформлением заказа. Оплата тестовая, без регистрации.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: shov,
    previewLabel: 'shov.example', demo: '/demos/shov/index.html', year: '2026',
    scope: ['Каталог с фильтрами и сортировкой', 'Карточки товаров с размерной сеткой', 'Корзина, доставка и тестовая оплата картой'],

    tone: '#bcbcb9', dark: false,
  },
  {
    id: 'komnata', name: 'Комната', category: 'Мебельный магазин',
    description: 'Каталог мебели с подбором по комнатам. Интерьерные коллекции, карточки товаров и пошаговый помощник для выбора.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: komnata,
    previewLabel: 'komnata.example', demo: '/demos/komnata/index.html', year: '2026',
    scope: ['Каталог и категории мебели', 'Карточки товаров и интерьерные подборки', 'Пошаговый подбор под комнату и бюджет'],

    tone: '#8f8f8c', dark: false,
  },
  {
    id: 'kontur', name: 'Контур', category: 'Детейлинг и тюнинг',
    description: 'Сайт автомобильной студии с выразительной фотоподачей. Услуги, галерея работ и форма расчёта стоимости.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: kontur,
    previewLabel: 'kontur.example', demo: '/demos/kontur/index.html', year: '2026',
    scope: ['Каталог услуг с выбором задачи', 'Фильтруемая галерея работ', 'Форма расчёта и адаптивные страницы'],

    tone: '#141415', dark: true,
  },
  {
    id: 'gran', name: 'Грань', category: 'Мебель на заказ',
    description: 'Интерьерный сайт о кухнях и системах хранения. Большие фотографии, готовые проекты и понятный путь от идеи до замера.',
    technologies: ['HTML', 'CSS', 'JavaScript'], image: gran,
    previewLabel: 'gran.example', demo: '/demos/gran/index.html', year: '2026',
    scope: ['Категории мебели на заказ', 'Галерея интерьерных проектов', 'Этапы работы и форма расчёта'],

    tone: '#d1d1ce', dark: false,
  },
  {
    id: 'list', name: 'Чистый лист', category: 'Клининговый сервис',
    description: 'Сайт сервиса уборки с прозрачной подачей услуг. Состав работ, стартовые цены и пошаговая заявка на расчёт.',
    technologies: ['Node.js', 'JavaScript', 'CSS'], image: list,
    previewLabel: 'chisty-list.example', demo: '/demos/list/index.html', year: '2026',
    scope: ['Услуги и состав уборки', 'Сравнение результатов до и после', 'Пошаговый расчёт по параметрам объекта'],

    tone: '#e9e9e6', dark: false,
  },
];
