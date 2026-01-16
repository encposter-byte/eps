import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { MapPin, Phone, Clock } from "lucide-react";

export default function AboutPage() {
  // Скролл к карте если в URL есть #map
  useEffect(() => {
    if (window.location.hash === '#map') {
      setTimeout(() => {
        const mapElement = document.getElementById('map');
        if (mapElement) {
          mapElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  const locations = [
    {
      city: "Волгоград",
      address: "ул. им. Маршала Еременко, д. 44",
      phone: "+7 929 780-48-46",
      tollFree: "8 800 101 38 35",
      coords: [48.762240, 44.536100]
    },
    {
      city: "Ростов-на-Дону",
      address: "проспект Королёва, д. 1Э",
      phone: "+7 960 444-75-95",
      tollFree: "8 800 101 38 35",
      coords: [47.290277, 39.692797]
    },
    {
      city: "Санкт-Петербург",
      address: "проспект Железнодорожный, д. 14 к7",
      phone: "+7 981 858-21-43",
      tollFree: "8 800 101 38 35",
      coords: [59.883060, 30.428867]
    },
    {
      city: "Новороссийск",
      address: "с. Гайдук, ул. Строительная д. 14",
      phone: "+7 918 120-85-55",
      tollFree: "8 800 101 38 35",
      coords: [44.783390, 37.698609]
    },
    {
      city: "Мариуполь",
      address: "ул. Соборная, д. 10",
      phone: "+7 949 023-20-77",
      tollFree: "8 800 101 38 35",
      coords: [47.098635, 37.541575]
    }
  ];

  const workingHours = {
    weekdays: "пн–пт 8:00–18:00, сб, вс — выходные"
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Helmet>
        <title>О компании | ЭПС</title>
        <meta name="description" content="Информация о компании ЭПС, наши филиалы, контакты и режим работы." />
      </Helmet>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">О компании ЭПС</h1>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="p-8">
            <h2 className="text-2xl font-semibold mb-4 text-eps-red">Наша цель</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Компания «ЭПС» специализируется на поставках профессионального инструмента и оборудования для строительных, ремонтных и промышленных работ. Мы предлагаем широкий ассортимент качественной продукции от ведущих производителей по конкурентоспособным ценам.
            </p>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Наша цель — обеспечить профессионалов надежным инструментом, который позволит выполнять работу максимально эффективно и качественно. Мы стремимся к долгосрочным партнерским отношениям с нашими клиентами, предоставляя им лучшее обслуживание и техническую поддержку.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Компания «ЭПС» постоянно расширяет свое присутствие по всей стране, открывая новые филиалы, чтобы быть ближе к своим партнерам.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Наши филиалы</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
              <div className="bg-eps-red/10 p-4">
                <h3 className="text-xl font-semibold text-eps-red flex items-center">
                  <MapPin className="h-5 w-5 mr-2 inline" />
                  г. {location.city}
                </h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-gray-700">
                  <span className="font-medium">Адрес:</span> {location.address}
                </p>
                <p className="text-gray-700 flex items-start">
                  <Phone className="h-4 w-4 mr-2 mt-1 text-eps-red" />
                  <span>
                    <span className="block">{location.phone}</span>
                    <span className="block text-sm text-gray-500">Бесплатный номер: {location.tollFree}</span>
                  </span>
                </p>
                <p className="text-gray-700 flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-1 text-eps-red" />
                  <span>
                    <span className="block">пн. - пт.: {workingHours.weekdays}</span>
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Яндекс Карта с филиалами */}
      <div id="map" className="mb-10 scroll-mt-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Наши филиалы на карте</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <iframe
            src="https://yandex.ru/map-widget/v1/?ll=40.000000%2C52.000000&pt=44.536100%2C48.762240%2Cpm2rdm~39.692797%2C47.290277%2Cpm2rdm~30.428867%2C59.883060%2Cpm2rdm~37.698609%2C44.783390%2Cpm2rdm~37.541575%2C47.098635%2Cpm2rdm&z=4"
            width="100%"
            height="450"
            frameBorder="0"
            title="Филиалы ЭПС на карте"
            className="w-full"
            style={{ display: 'block' }}
            allowFullScreen
          />
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
          Метки показывают расположение наших филиалов
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Преимущества сотрудничества с ЭПС</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="rounded-full bg-eps-red/10 w-12 h-12 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-eps-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Гарантия качества</h3>
            <p className="text-gray-600">Мы предлагаем только сертифицированную продукцию от проверенных производителей с официальной гарантией.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="rounded-full bg-eps-red/10 w-12 h-12 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-eps-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Конкурентные цены</h3>
            <p className="text-gray-600">Благодаря прямым поставкам и оптимизации логистики мы поддерживаем доступные цены на весь ассортимент.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="rounded-full bg-eps-red/10 w-12 h-12 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-eps-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Быстрая доставка</h3>
            <p className="text-gray-600">Оперативная доставка по всей России с собственными пунктами выдачи в крупных городах.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="rounded-full bg-eps-red/10 w-12 h-12 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-eps-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Техническая поддержка</h3>
            <p className="text-gray-600">Наши специалисты всегда готовы предоставить консультацию по подбору и использованию оборудования.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <div className="rounded-full bg-eps-red/10 w-12 h-12 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-eps-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Широкий ассортимент</h3>
            <p className="text-gray-600">Более 1000 наименований инструментов и оборудования для любых профессиональных задач.</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            {/* Блок временно пуст */}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-8 mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">О нас в цифрах</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-eps-red mb-2">5+</div>
            <div className="text-gray-600">Филиалов по России</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-eps-red mb-2">1000+</div>
            <div className="text-gray-600">Наименований товаров</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-eps-red mb-2">24/7</div>
            <div className="text-gray-600">Онлайн поддержка</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-eps-red mb-2">10+</div>
            <div className="text-gray-600">Лет на рынке</div>
          </div>
        </div>
      </div>
    </div>
  );
}
