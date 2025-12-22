import './style.scss';
import landmarks from './points.json';
import Sortable from 'sortablejs';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-geosearch/dist/geosearch.css';
import { SearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import iconUrl from '/node_modules/leaflet/dist/images/marker-icon.png';
import iconShadow from '/node_modules/leaflet/dist/images/marker-shadow.png';

const texts = {
  zh: {
    locate: "📍 定位我的位置",
    routeTitle: "路线规划",
    startPlaceholder: "起点（地址或点击地图）",
    endPlaceholder: "终点（地址或点击地图）",
    searchPlaceholder: "搜索地点",
    calcRoute: "规划路线",
    clearRoute: "清除路线",
    attractions: "热门景点",
    routeInfo: "路线信息",
    instructions: "使用说明",
    instructionsList: [
      "点击地图上的任意位置设置起点或终点",
      "使用景点旁的按钮快速设置路线",
      "点击\"定位我的位置\"在地图上显示您当前的位置",
      "使用搜索框快速查找景点"
    ],
    distance: "距离",
    time: "预计时间",
    from: "起点",
    to: "终点",
    km: "公里",
    min: "分钟",
    yourLocation: "您的位置",
    setAsStart: "设为起点",
    setAsEnd: "设为终点",
    shareRouteControl: '分享路线链接',
    metaDescription: '探索俄罗斯首都的著名地标和景点'
  },
  ru: {
    locate: "📍 Определить мое местоположение",
    routeTitle: "Построение маршрута",
    startPlaceholder: "Откуда (адрес или клик на карте)",
    endPlaceholder: "Куда (адрес или клик на карте)",
    searchPlaceholder: "Поиск мест",
    calcRoute: "Построить маршрут",
    clearRoute: "Очистить маршрут",
    attractions: "Достопримечательности",
    routeInfo: "Информация о маршруте",
    instructions: "Инструкция",
    instructionsList: [
      "Нажмите на любое место на карте, чтобы установить начальную или конечную точку",
      "Используйте кнопки рядом с достопримечательностями для быстрой установки маршрута",
      "Нажмите \"Определить мое местоположение\", чтобы показать ваше текущее местоположение на карте",
      "Используйте поле поиска для быстрого поиска достопримечательностей"
    ],
    distance: "Расстояние",
    time: "Примерное время",
    from: "От",
    to: "До",
    km: "км",
    min: "минут",
    yourLocation: "Ваше местоположение",
    setAsStart: "Отсюда",
    setAsEnd: "Сюда",
    shareRouteControl: 'Поделиться ссылкой на маршрут',
    metaDescription: 'Исследуйте достопримечательности столицы России'
  }
};

const routeSummary = document.getElementById('route-summary');

const locateText = document.getElementById('locate-text');
const routeTitle = document.getElementById('route-title');
const startPointInput = document.getElementById('start-point');
const endPointInput = document.getElementById('end-point');
const calcRouteControl = document.getElementById('calc-route');
const clearRouteControl = document.getElementById('clear-route');
const routeInfo = document.getElementById('route-info');
const routeInfoTitle = document.getElementById('route-info-title');
const instructionsTitle = document.getElementById('instructions-title');
const instructionsList = document.getElementById('instructions-list');
const switchLangControls = document.querySelectorAll('.lang-btn');
const poiList = document.getElementById('poi-list');
const searchResults = document.querySelector('.js-search-results');
const form = document.querySelector('.js-form');
const pointsList = form.querySelector('.route-input');
const locationControl = document.querySelector('.js-location-control');
const metaDescription = document.querySelector('meta[name="description"]');

const sharing = document.querySelector('.js-sharing');
const sharingToggler = document.querySelector('.js-sharing-toggler');

const popup = document.querySelector('.js-popup');
const popupCloser = popup.querySelector('.js-popup-close');
const popupContent = popup.querySelector('.js-popup-content');

const body = document.querySelector('body');

let currentSearchInput = null;

let routingControl = null;
let userLocation = null;
let customMarkers = [];
let endMarker = null;
let startPointId = null;
let endPointId = null;
let clickStartPoint = null;
let clickEndPoint = null;

let routes = null;

let userLocationMarker = null;

let scrollTop = 0;

let currentLang = (new URLSearchParams(window.location.search.replace(/^\?/, ''))).get('lang');

currentLang = currentLang ? currentLang : 'zh';

const updateRouteInfo = () => {
  if (routes) {
    const summary = routes[0].summary;

    const distance = (summary.totalDistance / 1000).toFixed(2);
    const time = Math.round(summary.totalTime / 60);

    routeSummary.innerHTML =
        `<p><strong>${texts[currentLang].distance}:</strong> ${distance} ${texts[currentLang].km}</p>
          <p><strong>${texts[currentLang].time}:</strong> ${time} ${texts[currentLang].min}</p>
          <p><strong>${texts[currentLang].from}:</strong> ${startPointInput.value}</p>
          <p><strong>${texts[currentLang].to}:</strong> ${endPointInput.value}</p>`;

    routeInfo.classList.add('active');
  } else {
    routeInfo.classList.remove('active');
  }
};


const changeHistory = () => {
  const searchParamsObj =
      new URLSearchParams(window.location.search.replace(/^\?/, ''));

  let searchParams = '';

  const searchLang = searchParamsObj.get('lang');

  if (!searchLang) {
    searchParams += `?lang=${currentLang}`;
  }

  searchParamsObj.forEach((val, key) => {
    if (key !== 'place') {
      searchParams += searchParams.length > 0 ? '&' : '?';
      searchParams += `${key}=${key === 'lang' ? currentLang : val}`;
    }
  });

  form.querySelectorAll('input[name=place]').forEach(item => {
    if (item.lat) {
      searchParams += `&place=${item.lat},${item.lng}`;
    }
  });

  window.history.pushState(
      null,
      null,
      window.location.origin + window.location.pathname + `${searchParams}`
  );
}


const switchLanguage = (lang) => {
  currentLang = lang;

  locateText.textContent = texts[lang].locate;
  routeTitle.textContent = texts[lang].routeTitle;
  startPointInput.placeholder = texts[lang].startPlaceholder;
  endPointInput.placeholder = texts[lang].endPlaceholder;
  calcRouteControl.textContent = texts[lang].calcRoute;
  clearRouteControl.textContent = texts[lang].clearRoute;
  routeInfoTitle.textContent = texts[lang].routeInfo;
  instructionsTitle.textContent = texts[lang].instructions;
  sharingToggler.setAttribute('aria-label', texts[lang].shareRouteControl);
  metaDescription.setAttribute('content', texts[lang].metaDescription);

  form.querySelectorAll('input[name=place]').forEach(item => {
    if (landmarks[item.markId]) {
      item.value = landmarks[item.markId].name[currentLang];
    }
  });

  instructionsList.innerHTML = '';
  texts[lang].instructionsList.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    instructionsList.appendChild(li);
  });

  switchLangControls.forEach(btn => {
    btn.addEventListener('click', () => {
      switchLanguage(btn.dataset.lang);
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });
  });

  updatePOIList();

  landmarks.forEach((landmark, index) => {
    landmark.marker.setPopupContent(getPopupContent(landmark, index));
  });

  updateRouteInfo();

  changeHistory();
}


const map = L.map('map').setView([55.7558, 37.6173], 11);


L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap贡献者'
}).addTo(map);


const getPopupContent = (landmark, index) => {
  return `<div class="info-window">
         <h3>${landmark.name[currentLang]}</h3>
         <p>${landmark.description[currentLang]}</p>
         ${landmark.article?.[currentLang] ? `<p><span class="pseudo-link js-show-article" data-id="${index}">Подробнее</span></p>` : ''}
         <button type="button" onclick="setPoint('${landmark.name[currentLang]}', ${landmark.lat}, ${landmark.lng}, ${index})"
         style="background: #27ae60; color: white; border: none; padding: 6px 12px; margin-right: 5px; border-radius: 4px; cursor: pointer; font-size: 13px;">
         ${currentLang === 'zh' ? '添加航点' : 'Добавить точку'}
         </button>
         </div>`;
};


landmarks.forEach((landmark, index) => {
  landmark.marker = L.marker([landmark.lat, landmark.lng], {
    icon: L.icon({
      iconUrl: iconUrl,
      shadowUrl: iconShadow,
      iconAnchor: [12.5, 41]
    })
  }).addTo(map);
  landmark.marker.bindPopup(getPopupContent(landmark, index));
});


function updatePOIList() {
  poiList.innerHTML = '';

  landmarks.forEach((landmark, index) => {
    const li = document.createElement('li');
    li.className = 'poi-item';
    li.innerHTML =
        `<div class="poi-name">
          <div class="name-ru">${landmark.name.ru}</div>
          <div class="name-zh">${landmark.name.zh}</div>
        </div>`;

    li.addEventListener('click', () => {
      setPoint(
          landmark.name[currentLang],
          landmark.lat,
          landmark.lng,
          index,
          currentSearchInput
      );
    });

    poiList.appendChild(li);
  });
}


updatePOIList();


const locateUser = () => {
  if (!window.navigator.geolocation) {
    window.alert(currentLang === 'zh' ? '您的浏览器不支持地理定位功能' : 'Ваш браузер не поддерживает геолокацию');
    return;
  }

  window.navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        userLocation = L.latLng(lat, lng);

        // 移除旧的位置标记
        if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
        }

        // 添加新的位置标记
        userLocationMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'location-marker',
            iconSize: [20, 20]
          })
        })
            .addTo(map)
            .bindPopup(currentLang === 'zh' ? '您的位置' : 'Ваше местоположение')
            .openPopup();

        // 将地图中心设置为用户位置
        map.setView([lat, lng], 14);

        // 提示设置为起点
        if (confirm(currentLang === 'zh' ? '是否将您的位置设置为路线起点？' : 'Установить ваше местоположение как точку отправления?')) {
          setPoint(
              currentLang === 'zh' ? '我的位置' : 'Мое местоположение',
              lat,
              lng,
              null,
              null,
              true
          );
        }
      },

      function(error) {
        let errorMessage = currentLang === 'zh' ? '无法获取您的位置：' : 'Не удалось определить местоположение: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += currentLang === 'zh' ? '您拒绝了位置访问权限' : 'Пользователь отказал в доступе к геолокации';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += currentLang === 'zh' ? '位置信息不可用' : 'Информация о местоположении недоступна';
            break;
          case error.TIMEOUT:
            errorMessage += currentLang === 'zh' ? '获取位置信息超时' : 'Время ожидания истекло';
            break;
          default:
            errorMessage += currentLang === 'zh' ? '发生未知错误' : 'Неизвестная ошибка';
        }
        window.alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000
      }
  );
}


const getRouteInputHTML = () => `<div class="route-input__item">
    <div class="route-input__sort-handle"></div>
    <input type="text" name="place" placeholder="起点（地址或点击地图）"/>
    <button class="route-input__edit-control js-add-point" type="button">+</button>
    <button class="route-input__edit-control js-remove-point" type="button">&minus;</button>
  </div>`;


window.setPoint = function(name, lat, lng, landmarkId, input, isFirst = false) {
  let currentInput = input;

  if (!currentInput) {
    if (!startPointInput.value) {
      currentInput = startPointInput;
    } else if (!endPointInput.value) {
      currentInput = endPointInput;
    } else {
      if (isFirst) {
        pointsList.insertAdjacentHTML('afterbegin', getRouteInputHTML());
        currentInput = form.querySelector('input[name="place"]');
      } else {
        const addControls = form.querySelectorAll('.js-add-point');

        addControls[addControls.length - 1].dispatchEvent(
            new MouseEvent(
                'click',
                {
                  bubbles: true,
                  cancelable: true,
                  view: window
                }
            )
        );

        currentInput = addControls[addControls.length - 1].closest('.route-input__item').nextSibling.querySelector('input[name=place]');
      }
    }
  }

  map.closePopup();

  currentInput.value = name;
  currentInput.markId = landmarkId;
  currentInput.lat = lat;
  currentInput.lng = lng;
  clickStartPoint = L.latLng(lat, lng);

  startPointId = landmarkId;

  const newMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map).bindPopup(`${currentLang === 'zh' ? '起点: ' : 'Точка A: '}${name}`);

  if (isFirst) {
    customMarkers.unshift(newMarker);
  } else {
    customMarkers.push(newMarker);
  }

  changeHistory();
};


const mapSearch = new SearchControl({
  notFoundMessage: 'Sorry, that address could not be found.',
  provider: new OpenStreetMapProvider(),
  style: 'button',
});

map.addControl(mapSearch);


// Initialize the OSRM router with the 'walking' profile
let walkingRouter = new L.Routing.OSRMv1({
  // serviceUrl: serviceUrl,
  profile: 'cycling' // Specify the profile here
});

function calculateRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
  }

  let points = [];

  form.querySelectorAll('input[name=place]').forEach(item => {
    if (item.lat) {
      points.push([item.lat, item.lng]);
    }
  });

  routingControl = L.Routing.control({
    language: currentLang === 'zh' ? 'en' : currentLang,
    waypoints: points,
    // router: walkingRouter,
    routeWhileDragging: true,
    showAlternatives: false,
    lineOptions: {
      styles: [{color: '#3498db', weight: 6}]
    },
    createMarker: function() {
      return null;
    }
  }).addTo(map);

  routingControl.on('routesfound', function(e) {
    routes = e.routes;
    updateRouteInfo();
  });
}

/*
// Функция для изменения маршрута в зависимости от типа
window.changeRoute = function (mode) {
  // Удаляем старый маршрут
  // routingControl.setWaypoints(waypoints);

  // Определяем опции маршрута
  const routeOptions = {};

  walkingRouter = new L.Routing.OSRMv1({
    profile: mode
  });

  // routingControl.setOptions(routeOptions);
}
*/

/*
// Добавляем кнопки для выбора типа маршрута
const buttons = L.control({ position: 'topright' });
buttons.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'leaflet-bar');
  div.innerHTML = `
        <button onclick="changeRoute('walking')">Пеший</button>
        <button onclick="changeRoute('cycling')">Велосипед</button>
        <button onclick="changeRoute('driving')">Автомобиль</button>
      `;

  div.addEventListener('click', (evt) => {
    evt.stopPropagation();
  });

  return div;
};
buttons.addTo(map);
*/


const clearRoute = () => {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  startPointInput.value = '';
  endPointInput.value = '';
  routeInfo.classList.remove('active');

  clickStartPoint = null;
  clickEndPoint = null;
  endMarker = null;
  startPointId = null;
  endPointId = null;

  if (customMarkers.length) {
    customMarkers.forEach(marker => {
      map.removeLayer(marker);
    });
  }

  customMarkers = [];

  if (endMarker) {
    map.removeLayer(endMarker);
  }

  pointsList.querySelectorAll('.route-input__item').forEach(item => {
    const input = item.querySelector('input[name=place]');

    if (input.id !== 'start-point' && input.id !== 'end-point') {
      item.remove();
    }

    input.lat = null;
    input.lng = null;
  });

  form.reset();

  changeHistory();
}


map.on('click', function(e) {
  const latlng = e.latlng;

  setPoint(
      `${currentLang === 'zh' ? '地图位置' : 'Точка на карте'} (${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)})`,
      latlng.lat,
      latlng.lng,
      null
  );
});


const search = (searchControl) => {
  const searchTerm = searchControl.value.toLowerCase();
  const items = document.querySelectorAll('.poi-item');

  items.forEach(item => {
    const ruText = item.querySelector('.name-ru').textContent.toLowerCase();
    const zhText = item.querySelector('.name-zh').textContent.toLowerCase();

    item.classList.toggle('hidden', !ruText.includes(searchTerm) && !zhText.includes(searchTerm));
  });

  const isOpened = Array.from(items).some(item => item.classList.length === 1);

  searchResults.style.top = `${searchControl.offsetTop + searchControl.offsetHeight}px`;
  searchResults.classList.toggle('hidden', !isOpened);

  if (isOpened) {
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('click', onDocumentClick);
  }
};


const closeShare = () => {
  sharing.classList.add('visually-hidden');
};

const closeSearchResults = () => {
  searchResults.classList.add('hidden');
  document.removeEventListener('keydown', onDocumentKeyDown);
  document.removeEventListener('click', onDocumentClick);
};


const closePopup = () => {
  popup.classList.add('hidden');
  body.classList.remove('fixed');
};


const onDocumentKeyDown = (evt) => {
  if (evt.key && evt.key.toLowerCase() === 'escape') {
    closeSearchResults();
    closeShare();
    closePopup();
  }
};


const onDocumentClick = () => {
  closeSearchResults();
  closeShare();
};


calcRouteControl.addEventListener('click', () => {
  calculateRoute();
});


clearRouteControl.addEventListener('click', () => {
  clearRoute();
});


form.addEventListener('input', (evt) => {
  currentSearchInput = evt.target;

  if (currentSearchInput.value.trim().length > 0) {
    search(currentSearchInput);
  } else {
    currentSearchInput.markId = null;
  }
});


form.addEventListener('click', (evt) => {
  const button = evt.target;
  const parent = button.closest('.route-input__item');

  if (button.classList.contains('js-add-point')) {
    parent.insertAdjacentHTML('afterend', getRouteInputHTML());
  } else if (button.classList.contains('js-remove-point')) {
    parent.remove();
    changeHistory();
  }
});


sharingToggler.addEventListener('click', (evt) => {
  evt.stopPropagation();
  sharing.classList.toggle('visually-hidden');

  if (!sharing.classList.contains('visually-hidden')) {
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('click', onDocumentClick);
  }
});


new Sortable(pointsList, {
  animation: 150,
  ghostClass: 'blue-background-class',
  draggable: '.route-input__item',
  handle: '.route-input__sort-handle',
  onUpdate: function() {
    changeHistory();
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const searchParamsObj =
      new URLSearchParams(window.location.search.replace(/^\?/, ''));

  const placeParams = searchParamsObj.getAll('place');

  placeParams.forEach(item => {
    const coords = item.split(',');
    let landmarkId = null;

    const point = landmarks.find((mark, index) => {
      const result = mark.lat.toString() === coords[0] && mark.lng.toString() === coords[1];

      landmarkId = result ? index : null;

      return result;
    });

    setPoint(
        point ? point.name[currentLang] : `${currentLang === 'zh' ? '地图位置' : 'Точка на карте'} (${coords[0]}, ${coords[1]})`,
        coords[0],
        coords[1],
        landmarkId
    );
  });

  switchLanguage(currentLang);

  if (placeParams.length > 1) {
    calculateRoute();
  }
});


locationControl.addEventListener('click', () => {
  locateUser();
});


popupCloser.addEventListener('click', () => {
  popup.classList.add('hidden');
  body.classList.remove('fixed');
  document.removeEventListener('keydown', onDocumentKeyDown);
});


document.querySelector('#map').addEventListener('click', (evt) => {
  if(evt.target.classList.contains('js-show-article')) {
    const point = landmarks[parseInt(evt.target.dataset.id, 10)];
    scrollTop = window.scrollY;

    popupContent.innerHTML = `<h2>${point.name[currentLang]}</h2>${point.article[currentLang]}`;

    body.classList.add('fixed');
    popup.classList.remove('hidden');

    window.scrollTo({top: scrollTop});

    document.addEventListener('keydown', onDocumentKeyDown);
  }
});

// Функция обновления местоположения
const updateLocation = (position) => {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;

  // Обновляем координаты маркера
  userLocationMarker?.setLatLng([lat, lon]);

  // Автоматически перемещаем карту на текущие координаты
  map.setView([lat, lon], 13);
}

// Получение местоположения пользователя
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(updateLocation, (err) => {
    window.console.error('Ошибка получения геолокации:', err);
  });
}
