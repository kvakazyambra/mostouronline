import './style.scss'
import landmarks from './points.json';


// Language texts
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
    setAsEnd: "设为终点"
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
    setAsEnd: "Сюда"
  }
};

const routeSummary = document.getElementById('route-summary');

const locateText = document.getElementById('locate-text');
const routeTitle = document.getElementById('route-title');
const startPointInput = document.getElementById('start-point');
const endPointInput = document.getElementById('end-point');
const searchInput = document.getElementById('search-input');
const calcRouteControl = document.getElementById('calc-route');
const clearRouteControl = document.getElementById('clear-route');
const attractionsTitle = document.getElementById('attractions-title');
const routeInfo = document.getElementById('route-info');
const routeInfoTitle = document.getElementById('route-info-title');
const instructionsTitle = document.getElementById('instructions-title');
const instructionsList = document.getElementById('instructions-list');
const switchLangControls = document.querySelectorAll('.lang-btn');
const poiList = document.getElementById('poi-list');

// 路由变量
let routingControl = null;
let userLocation = null;
let startMarker = null;
let endMarker = null;
let startPointId = null;
let endPointId = null;
let clickStartPoint = null;
let clickEndPoint = null;

let routes = null;

// Current language
let currentLang = 'zh';

// Switch language function
window.switchLanguage = function(lang) {
  currentLang = lang;

  // Update UI texts
  locateText.textContent = texts[lang].locate;
  routeTitle.textContent = texts[lang].routeTitle;
  startPointInput.placeholder = texts[lang].startPlaceholder;
  endPointInput.placeholder = texts[lang].endPlaceholder;
  searchInput.placeholder = texts[lang].searchPlaceholder;
  calcRouteControl.textContent = texts[lang].calcRoute;
  clearRouteControl.textContent = texts[lang].clearRoute;
  attractionsTitle.textContent = texts[lang].attractions;
  routeInfoTitle.textContent = texts[lang].routeInfo;
  instructionsTitle.textContent = texts[lang].instructions;

  if (startPointId && !isNaN(startPointId)) {
    startPointInput.value = landmarks[startPointId].name[currentLang];
  }

  if (endPointId && !isNaN(endPointId)) {
    endPointInput.value = landmarks[endPointId].name[currentLang];
  }

  // Update instructions list
  instructionsList.innerHTML = '';
  texts[lang].instructionsList.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    instructionsList.appendChild(li);
  });

  // Update language buttons
  switchLangControls.forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Update POI list
  updatePOIList();

  landmarks.forEach((landmark, index) => {
    landmark.marker.setPopupContent(getPopupContent(landmark, index));
  });

  updateRouteInfo();
}

// 初始化地图
const map = L.map('map').setView([55.7558, 37.6173], 11);

// 添加OpenStreetMap图层
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap贡献者'
}).addTo(map);

const getPopupContent = (landmark, index) => {
  return `<div class="info-window">
         <h3>${landmark.name[currentLang]}</h3>
         <p>${landmark.description[currentLang]}</p>
         <button onclick="setAsStart('${landmark.name[currentLang]}', ${landmark.lat}, ${landmark.lng}, ${index})"
         style="background: #f39c12; color: white; border: none; padding: 6px 12px; margin-right: 5px; border-radius: 4px; cursor: pointer; font-size: 13px;">
         ${currentLang === 'zh' ? '设为起点' : 'Отсюда'}
         </button>
         <button onclick="setAsEnd('${landmark.name[currentLang]}', ${landmark.lat}, ${landmark.lng}, ${index})"
         style="background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">
         ${currentLang === 'zh' ? '设为终点' : 'Сюда'}
         </button>
         </div>`;
};


// 添加地标标记
landmarks.forEach((landmark, index) => {
  landmark.marker = L.marker([landmark.lat, landmark.lng]).addTo(map);
  landmark.marker.bindPopup(getPopupContent(landmark, index));
});


// 更新POI列表
function updatePOIList() {
  poiList.innerHTML = '';

  landmarks.forEach((landmark, index) => {
    const li = document.createElement('li');
    li.className = 'poi-item';
    li.innerHTML =
        `<div class="poi-name">
          <div class="name-ru">${landmark.name.ru}</div>
          <div class="name-zh">${landmark.name.zh}</div>
          </div>
          <div class="poi-actions">
          <button class="poi-action-btn btn-warning" onclick="setAsStart('${landmark.name[currentLang]}', ${landmark.lat}, ${landmark.lng}, ${index})">
          ${currentLang === 'zh' ? '起点' : 'A'}
          </button>
          <button class="poi-action-btn btn-success" onclick="setAsEnd('${landmark.name[currentLang]}', ${landmark.lat}, ${landmark.lng}, ${index})">
          ${currentLang === 'zh' ? '终点' : 'B'}
          </button>
          </div>`;
    poiList.appendChild(li);
  });
}

// 初始化POI列表
updatePOIList();

// 定位用户位置
function locateUser() {
  if (!navigator.geolocation) {
    alert(currentLang === 'zh' ? '您的浏览器不支持地理定位功能' : 'Ваш браузер не поддерживает геолокацию');
    return;
  }

  navigator.geolocation.getCurrentPosition(
      function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        userLocation = L.latLng(lat, lng);

        // 移除旧的位置标记
        if (window.userLocationMarker) {
          map.removeLayer(window.userLocationMarker);
        }

        // 添加新的位置标记
        window.userLocationMarker = L.marker([lat, lng], {
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
          setAsStart(currentLang === 'zh' ? '我的位置' : 'Мое местоположение', lat, lng);
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
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
  );
}

// 设置起点
window.setAsStart = function(name, lat, lng, landmarkId) {
  startPointInput.value = name;
  clickStartPoint = L.latLng(lat, lng);

  // 移除旧的起点标记
  if (startMarker) {
    map.removeLayer(startMarker);
  }

  startPointId = landmarkId;

  // 添加新的起点标记
  startMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map).bindPopup(`${currentLang === 'zh' ? '起点: ' : 'Точка A: '}${name}`);
}

// 设置终点
window.setAsEnd = function(name, lat, lng, landmarkId) {
  endPointInput.value = name;
  clickEndPoint = L.latLng(lat, lng);

  // 移除旧的终点标记
  if (endMarker) {
    map.removeLayer(endMarker);
  }

  endPointId = landmarkId;

  // 添加新的终点标记
  endMarker = L.marker([lat, lng], {
    icon: L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }).addTo(map).bindPopup(`${currentLang === 'zh' ? '终点: ' : 'Точка B: '}${name}`);
}

// 计算路线
function calculateRoute() {
  const startInput = startPointInput.value;
  const endInput = endPointInput.value;

  let startPoint = clickStartPoint;
  let endPoint = clickEndPoint;

  // 如果未通过点击设置点，则按名称查找
  if (!startPoint) {
    const startLandmark = landmarks.find(l => l.name.ru === startInput || l.name.zh === startInput);
    if (startLandmark) {
      startPoint = L.latLng(startLandmark.lat, startLandmark.lng);
    }
  }

  if (!endPoint) {
    const endLandmark = landmarks.find(l => l.name.ru === endInput || l.name.zh === endInput);
    if (endLandmark) {
      endPoint = L.latLng(endLandmark.lat, endLandmark.lng);
    }
  }

  if (!startPoint || !endPoint) {
    alert(currentLang === 'zh' ? '请设置起点和终点' : 'Пожалуйста, установите точки отправления и назначения');
    return;
  }

  // 清除之前的路线
  if (routingControl) {
    map.removeControl(routingControl);
  }

  // 创建新路线
  routingControl = L.Routing.control({
    language: currentLang === 'zh' ? 'en' : currentLang,
    waypoints: [startPoint, endPoint],
    routeWhileDragging: false,
    showAlternatives: false,
    lineOptions: {
      styles: [{color: '#3498db', weight: 6}]
    },
    createMarker: function() {
      return null;
    } // 不创建默认标记
  }).addTo(map);

  // 路线计算完成处理
  routingControl.on('routesfound', function(e) {
    routes = e.routes;
    updateRouteInfo();
  });
}

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

// 清除路线
function clearRoute() {
  if (routingControl) {
    map.removeControl(routingControl);
    routingControl = null;
  }

  startPointInput.value = '';
  endPointInput.value = '';
  routeInfo.classList.remove('active');

  clickStartPoint = null;
  clickEndPoint = null;
  startMarker = null;
  endMarker = null;
  startPointId = null;
  endPointId = null;

  if (startMarker) {
    map.removeLayer(startMarker);
  }

  if (endMarker) {
    map.removeLayer(endMarker);
  }
}

// 地图点击事件处理
map.on('click', function(e) {
  const latlng = e.latlng;

  if (confirm(currentLang === 'zh' ? '设置此位置为:' : 'Установить эту точку как:')) {
    const choice = prompt(currentLang === 'zh' ? '请选择:\n1 - 起点\n2 - 终点' : 'Выберите:\n1 - Точка отправления (A)\n2 - Точка назначения (B)');

    if (choice === '1') {
      setAsStart(
          `${currentLang === 'zh' ? '地图位置' : 'Точка на карте'} (${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)})`,
          latlng.lat,
          latlng.lng
      );
    } else if (choice === '2') {
      setAsEnd(
          `${currentLang === 'zh' ? '地图位置' : 'Точка на карте'} (${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)})`,
          latlng.lat,
          latlng.lng
      );
    }
  }
});

// 搜索功能
document.getElementById('search-input').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  const items = document.querySelectorAll('.poi-item');

  items.forEach(item => {
    const ruText = item.querySelector('.name-ru').textContent.toLowerCase();
    const zhText = item.querySelector('.name-zh').textContent.toLowerCase();
    if (ruText.includes(searchTerm) || zhText.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
});


calcRouteControl.addEventListener('click', () => {
  calculateRoute();
});

clearRouteControl.addEventListener('click', () => {
  clearRoute();
});
