import html2canvas from "html2canvas";

export default async function captureToPng(
  element: HTMLElement,
  filename: string
) {
  const canvas = await html2canvas(element, { useCORS: true, logging: false });
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
