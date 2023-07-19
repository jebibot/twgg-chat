import html2canvas from "html2canvas";

export default async function captureToPng(
  element: HTMLElement,
  dark: boolean,
  filename: string,
) {
  const canvas = await html2canvas(element, {
    useCORS: true,
    logging: false,
    backgroundColor: dark ? "#18181b" : "#ffffff",
  });
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
