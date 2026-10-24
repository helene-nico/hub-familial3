      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  if (typeof html2pdf !== 'undefined') {
    const opt = {
      margin: 10,
      filename: 'Cahier_Recettes_Semaine.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(container).toPdf().get('pdf').then(function(pdf) {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      if (pdfTab) {
        pdfTab.location.href = blobUrl;
      } else {
        window.open(blobUrl, '_blank');
      }
    }).catch(err => {
      console.error(err);
      if (pdfTab) pdfTab.document.body.innerHTML = container.innerHTML;
    });
  } else {
    if (pdfTab) pdfTab.document.body.innerHTML = container.innerHTML;
  }
};
