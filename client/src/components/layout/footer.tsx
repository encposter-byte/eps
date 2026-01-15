import {
  Phone,
  MapPin,
  Clock,
  Mail
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white">
      {/* Decorative top border */}
      <div className="bg-eps-gradient h-1"></div>

      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Контакты - горизонтальный блок */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 lg:gap-16 mb-10">
          {/* Телефон */}
          <a href="tel:88001013835" className="flex items-center space-x-3 group">
            <div className="p-3 bg-eps-orange/20 rounded-full group-hover:bg-eps-orange/30 transition">
              <Phone className="w-5 h-5 text-eps-orange" />
            </div>
            <div>
              <p className="text-white font-bold text-lg group-hover:text-eps-orange transition">
                8 800 101 38 35
              </p>
              <p className="text-gray-400 text-xs">Бесплатно по России</p>
            </div>
          </a>

          {/* Режим работы */}
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-eps-yellow/20 rounded-full">
              <Clock className="w-5 h-5 text-eps-yellow" />
            </div>
            <div>
              <p className="text-white font-medium">пн–пт 8:00–18:00</p>
              <p className="text-gray-400 text-xs">сб, вс — выходные</p>
            </div>
          </div>

          {/* Email */}
          <a href="mailto:info@eps.su" className="flex items-center space-x-3 group">
            <div className="p-3 bg-eps-red/20 rounded-full group-hover:bg-eps-red/30 transition">
              <Mail className="w-5 h-5 text-eps-red" />
            </div>
            <div>
              <p className="text-white font-medium group-hover:text-eps-red transition">info@eps.su</p>
              <p className="text-gray-400 text-xs">Напишите нам</p>
            </div>
          </a>
        </div>

        {/* Разделитель */}
        <div className="border-t border-slate-700/50 mb-8"></div>

        {/* Наши филиалы */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <MapPin className="w-5 h-5 text-eps-orange" />
            <h4 className="text-lg font-semibold text-white">Наши филиалы</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {[
              {
                city: "Волгоград",
                address: "ул. им. Маршала Еременко, д. 44",
                phone: "+7 929 780-48-46"
              },
              {
                city: "Ростов-на-Дону",
                address: "пр. Королёва, д. 1Э",
                phone: "+7 960 444-75-95"
              },
              {
                city: "Санкт-Петербург",
                address: "пр. Железнодорожный, д. 14 к7",
                phone: "+7 905 063-96-66"
              },
              {
                city: "Новороссийск",
                address: "с. Гайдук, ул. Строительная д. 14",
                phone: "+7 918 120-85-55"
              },
              {
                city: "Мариуполь",
                address: "ул. Соборная, д. 10",
                phone: "+7 999 749-97-77"
              }
            ].map((branch, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-eps-orange" />
                  <h5 className="font-semibold text-white">{branch.city}</h5>
                </div>
                <p className="text-gray-400 text-sm mb-2 leading-tight">{branch.address}</p>
                <a
                  href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`}
                  className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-eps-orange transition"
                >
                  <Phone className="w-3 h-3" />
                  {branch.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Копирайт */}
        <div className="text-center pt-6 border-t border-slate-700/50">
          <p className="text-gray-500 text-sm">© {new Date().getFullYear()} ЭПС. Все права защищены.</p>
        </div>
      </div>

      {/* Decorative bottom pattern */}
      <div className="h-1 bg-eps-gradient"></div>
    </footer>
  );
}
