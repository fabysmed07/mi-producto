'use client';

import { useEffect, useState } from 'react';

// El servidor y el navegador tienen distinta zona horaria e idioma: la fecha local se calcula
// solo en el cliente, tras montar, para que la hidratación no vea textos distintos.
export default function LocalDate({ iso }: { iso: string }) {
  const [text, setText] = useState('');
  useEffect(() => { setText(new Date(iso).toLocaleString()); }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}
