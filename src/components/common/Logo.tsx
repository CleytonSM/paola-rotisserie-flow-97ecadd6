/**
 * Logo Paola Gonçalves Rotisserie
 * Fundo amarelo vibrante com P&G em verde e folhas decorativas
 */

export const Logo = ({ className = "h-12" }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Fundo amarelo */}
      <rect width="200" height="80" rx="8" fill="#FFC107"/>
      
      {/* Folhas decorativas esquerda */}
      <path d="M20 25 Q15 30 20 35 L18 40 Q20 38 22 40 L20 35 Q25 30 20 25Z" fill="#4CAF50"/>
      <path d="M25 22 Q20 25 23 30 L21 34 Q23 32 25 34 L23 30 Q27 25 25 22Z" fill="#388E3C"/>
      
      {/* P&G - Tipografia serif bold */}
      <text x="50" y="55" fontFamily="serif" fontSize="36" fontWeight="700" fill="#4CAF50" letterSpacing="2">
        P&G
      </text>
      
      {/* Folhas decorativas direita */}
      <path d="M175 25 Q180 30 175 35 L177 40 Q175 38 173 40 L175 35 Q170 30 175 25Z" fill="#4CAF50"/>
      <path d="M170 22 Q175 25 172 30 L174 34 Q172 32 170 34 L172 30 Q168 25 170 22Z" fill="#388E3C"/>
      
      {/* Texto subtitle */}
      <text x="100" y="68" fontFamily="Inter, sans-serif" fontSize="9" fontWeight="500" fill="#4CAF50" textAnchor="middle" letterSpacing="1">
        ROTISSERIE
      </text>
    </svg>
  );
};
