// app/components/Slideshow.tsx
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Definisikan tipe untuk setiap slide
interface SlideData {
  image: string;
  title: string;
  subtitle: string;
  buttonText: string;
}

const slides: SlideData[] = [
  {
    image: '/slide1.jpg', // Ganti dengan path gambar Anda di /public
    title: 'Buka Potensi Anda Bersama Kami',
    subtitle: 'Kurikulum terbaik untuk masa depan cerah.',
    buttonText: 'Lihat Program',
  },
  {
    image: '/slide2.jpg',
    title: 'Pendidikan Berkualitas Internasional',
    subtitle: 'Didukung oleh para pengajar profesional.',
    buttonText: 'Tentang Kami',
  },
  {
    image: '/slide3.jpg',
    title: 'Daftar Sekarang & Dapatkan Penawaran Spesial',
    subtitle: 'Promo terbatas untuk pendaftaran bulan ini.',
    buttonText: 'Daftar Sekarang',
  },
];

export default function Slideshow() {
  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        className="h-[60vh] md:h-[45vh]"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative">
            {/* Pastikan Anda punya gambar di /public atau gunakan placeholder */}
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <span className="text-white text-2xl">Gambar Slide {index + 1}</span>
            </div>
            {/* Ganti div di atas dengan Image component jika sudah ada gambar */}
            {/* <Image src={slide.image} alt={slide.title} layout="fill" objectFit="cover" className="brightness-50" /> */}
            
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4 bg-black bg-opacity-40">
              <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">{slide.title}</h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl">{slide.subtitle}</p>
              <a href="#" className="px-6 py-3 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors font-bold">
                {slide.buttonText}
              </a>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}