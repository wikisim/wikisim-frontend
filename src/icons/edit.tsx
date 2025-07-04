
export default function EditIcon({ colour = "#555" }: { colour?: string })
{
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" fill="none"/>
        <path d="M3 17.25V21h3.75l11.06-11.06-3.75-3.75L3 17.25z" fill={colour}/>
        <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#555"/>
    </svg>
}
