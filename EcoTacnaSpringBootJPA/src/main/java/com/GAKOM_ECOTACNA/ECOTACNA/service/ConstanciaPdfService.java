package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class ConstanciaPdfService {

    private static final Font TITLE_FONT = new Font(Font.FontFamily.HELVETICA, 16, Font.BOLD, new BaseColor(46, 125, 50)); // Verde institucional
    private static final Font SUBTITLE_FONT = new Font(Font.FontFamily.HELVETICA, 12, Font.BOLD, BaseColor.DARK_GRAY);
    private static final Font BOLD_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD);
    private static final Font NORMAL_FONT = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL);
    private static final Font DISCLAIMER_FONT = new Font(Font.FontFamily.HELVETICA, 8, Font.ITALIC, BaseColor.GRAY);

    public byte[] generateConstancia(PickupRequest request) throws DocumentException {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);

        document.open();

        // Título
        Paragraph title = new Paragraph("Constancia de Recojo y Pago EcoTacna", TITLE_FONT);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(10);
        document.add(title);

        // Código y fechas
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String anio = request.getRequestedAt() != null ? String.valueOf(request.getRequestedAt().getYear()) : "2026";
        
        Paragraph header = new Paragraph();
        header.add(new Chunk("Código: ECO-" + request.getId() + "-" + anio + "\n", BOLD_FONT));
        header.add(new Chunk("Fecha de emisión: " + java.time.LocalDateTime.now().format(dtf) + "\n", NORMAL_FONT));
        header.add(new Chunk("Estado del recojo: " + request.getStatus().name() + "\n", NORMAL_FONT));
        header.add(new Chunk("Estado de pago: " + (request.getEstadoPago() != null ? request.getEstadoPago() : "PENDIENTE") + "\n", NORMAL_FONT));
        header.setSpacingAfter(20);
        document.add(header);

        // Datos del restaurante/generador
        document.add(new Paragraph("1. Datos del Restaurante / Generador", SUBTITLE_FONT));
        document.add(createGeneradorTable(request.getCompany(), request.getDireccion()));
        document.add(new Paragraph(" ", NORMAL_FONT));

        // Datos del recolector
        if (request.getTransportUnit() != null && request.getTransportUnit().getCollectorCompany() != null) {
            document.add(new Paragraph("2. Datos del Recolector y Unidad", SUBTITLE_FONT));
            document.add(createRecolectorTable(request));
            document.add(new Paragraph(" ", NORMAL_FONT));
        }

        // Datos del recojo y económicos
        document.add(new Paragraph("3. Detalles del Recojo y Económicos", SUBTITLE_FONT));
        document.add(createDetallesTable(request, dtf));
        document.add(new Paragraph(" ", NORMAL_FONT));

        // Disclaimer
        Paragraph disclaimer = new Paragraph("Esta constancia acredita el recojo de aceite vegetal usado registrado en la plataforma EcoTacna. No constituye comprobante tributario.", DISCLAIMER_FONT);
        disclaimer.setAlignment(Element.ALIGN_CENTER);
        disclaimer.setSpacingBefore(30);
        document.add(disclaimer);

        document.close();
        return out.toByteArray();
    }

    private PdfPTable createGeneradorTable(Company company, String direccion) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 3.5f});

        addCell(table, "Razón social:", BOLD_FONT);
        addCell(table, company.getBusinessName() != null ? company.getBusinessName() : "-", NORMAL_FONT);

        addCell(table, "RUC:", BOLD_FONT);
        addCell(table, company.getRuc() != null ? company.getRuc() : "-", NORMAL_FONT);

        addCell(table, "Correo:", BOLD_FONT);
        addCell(table, "No registrado", NORMAL_FONT);

        addCell(table, "Dirección de recojo:", BOLD_FONT);
        addCell(table, direccion != null ? direccion : "-", NORMAL_FONT);

        return table;
    }

    private PdfPTable createRecolectorTable(PickupRequest request) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 3.5f});
        
        Company recolector = request.getTransportUnit().getCollectorCompany();

        addCell(table, "Razón social:", BOLD_FONT);
        addCell(table, recolector.getBusinessName() != null ? recolector.getBusinessName() : "-", NORMAL_FONT);

        addCell(table, "RUC:", BOLD_FONT);
        addCell(table, recolector.getRuc() != null ? recolector.getRuc() : "-", NORMAL_FONT);

        addCell(table, "Correo:", BOLD_FONT);
        addCell(table, "No registrado", NORMAL_FONT);

        addCell(table, "Placa Unidad:", BOLD_FONT);
        addCell(table, request.getTransportUnit().getPlate() != null ? request.getTransportUnit().getPlate() : "-", NORMAL_FONT);
        
        addCell(table, "Tipo de Unidad:", BOLD_FONT);
        addCell(table, request.getTransportUnit().getUnitType() != null ? request.getTransportUnit().getUnitType() : "-", NORMAL_FONT);
        
        addCell(table, "Marca / Modelo:", BOLD_FONT);
        addCell(table, (request.getTransportUnit().getBrand() != null ? request.getTransportUnit().getBrand() : "-") + " / " + (request.getTransportUnit().getModel() != null ? request.getTransportUnit().getModel() : "-"), NORMAL_FONT);
        
        addCell(table, "Capacidad L:", BOLD_FONT);
        addCell(table, request.getTransportUnit().getCapacityLiters() != null ? request.getTransportUnit().getCapacityLiters().toString() : "-", NORMAL_FONT);

        return table;
    }

    private PdfPTable createDetallesTable(PickupRequest request, DateTimeFormatter dtf) throws DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2f, 3f});

        addCell(table, "Fecha de solicitud:", BOLD_FONT);
        addCell(table, request.getRequestedAt() != null ? request.getRequestedAt().format(dtf) : "-", NORMAL_FONT);

        addCell(table, "Fecha programada:", BOLD_FONT);
        addCell(table, request.getScheduledAt() != null ? request.getScheduledAt().format(dtf) : "-", NORMAL_FONT);

        addCell(table, "Fecha confirmación pago:", BOLD_FONT);
        addCell(table, request.getFechaConfirmacionPago() != null ? request.getFechaConfirmacionPago().format(dtf) : "-", NORMAL_FONT);

        addCell(table, "Volumen aproximado:", BOLD_FONT);
        addCell(table, request.getApproximateVolumeLiters() != null ? request.getApproximateVolumeLiters() + " L" : "-", NORMAL_FONT);

        addCell(table, "Litros confirmados:", BOLD_FONT);
        addCell(table, request.getLitrosConfirmados() != null ? request.getLitrosConfirmados() + " L" : "-", NORMAL_FONT);
        
        addCell(table, "Precio ofertado / L:", BOLD_FONT);
        addCell(table, request.getPrecioOfertadoPorLitro() != null ? "S/ " + request.getPrecioOfertadoPorLitro() : "No registrado", NORMAL_FONT);

        addCell(table, "Monto estimado:", BOLD_FONT);
        if (request.getApproximateVolumeLiters() != null && request.getPrecioOfertadoPorLitro() != null) {
            addCell(table, "S/ " + request.getApproximateVolumeLiters().multiply(request.getPrecioOfertadoPorLitro()), NORMAL_FONT);
        } else {
            addCell(table, "No disponible", NORMAL_FONT);
        }

        addCell(table, "Precio aplicado / L:", BOLD_FONT);
        addCell(table, request.getPrecioPorLitro() != null ? "S/ " + request.getPrecioPorLitro() : "-", NORMAL_FONT);

        addCell(table, "Monto total final:", BOLD_FONT);
        addCell(table, request.getMontoTotal() != null ? "S/ " + request.getMontoTotal() : "-", NORMAL_FONT);

        addCell(table, "Estado:", BOLD_FONT);
        addCell(table, request.getEstadoPago() != null ? request.getEstadoPago() : "-", NORMAL_FONT);

        addCell(table, "Observación del recojo:", BOLD_FONT);
        addCell(table, request.getObservaciones() != null ? request.getObservaciones() : "-", NORMAL_FONT);

        addCell(table, "Observación de pago:", BOLD_FONT);
        addCell(table, request.getObservacionPago() != null ? request.getObservacionPago() : "-", NORMAL_FONT);

        return table;
    }

    private void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5);
        cell.setBorderColor(BaseColor.LIGHT_GRAY);
        table.addCell(cell);
    }
}
