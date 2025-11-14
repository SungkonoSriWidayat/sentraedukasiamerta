// app/page.tsx
import Header from './components/Header';
import Slideshow from './components/Slideshow'; // Atau versi dynamic import
import ClassGrid from './components/ClassGrid';
import Footer from './components/Footer';
import dbConnect from '@/lib/mongodb';
import Class from '@/models/Class';
// app/page.tsx
export const dynamic = 'force-dynamic';

// Kode halaman Anda yang sudah ada...

async function getClasses() {
  await dbConnect();
  const classes = await Class.find({}).lean(); // .lean() untuk objek JS biasa
  // Kita perlu serialize _id karena tidak bisa langsung dilempar sebagai prop
  return JSON.parse(JSON.stringify(classes));
}

export default async function HomePage() {
  const classesData = await getClasses();
  // Lakukan hal yang sama untuk data Slideshow

  return (
    <div>
      <Header />
      <main>
        <div className="mb-8">
        <Slideshow />
      </div>
        <ClassGrid classes={classesData} />
      </main>
      <Footer />
    </div>
  );
}
