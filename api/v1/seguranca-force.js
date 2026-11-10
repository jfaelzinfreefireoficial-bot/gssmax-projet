/**
 * GSS Max - Security Force API (seguranca-force.js)
 * Sistema completo de blindagem: Anti-cópia, Anti-zoom e Anti-download/Inspeção.
 */
(function() {
    'use strict';

    // 1. Injeção de CSS para bloqueio de seleção e destaque de texto
    const style = document.createElement('style');
    style.innerHTML = `
        * {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
        }
        input, textarea, select {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Bloqueio de Clique Direito (Menu de Contexto)
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });

    // 3. Bloqueio de Atalhos de Teclado (F12, Ctrl+U, Ctrl+C, Ctrl+S, Ctrl+P, etc.)
    document.addEventListener('keydown', function(e) {
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
            (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'c' || e.key === 'C' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P'))
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 4. Anti-Zoom por Pinça (Mobile)
    document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
    document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
    document.addEventListener('gestureend', function(e) { e.preventDefault(); });

    // 5. Anti-Zoom via Ctrl + Scroll (Desktop)
    window.addEventListener('wheel', function(e) {
        if (e.ctrlKey) {
            e.preventDefault();
        }
    }, { passive: false });

    console.log("🛡️ GSS Max Security Force ativado com sucesso.");
      
})();
