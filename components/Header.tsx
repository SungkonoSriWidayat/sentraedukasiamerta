import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800">
          MyLearning
        </Link>
        <div>
          <Link href="/courses" className="text-gray-600 hover:text-blue-500 mx-3">
            Courses
          </Link>
          <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;