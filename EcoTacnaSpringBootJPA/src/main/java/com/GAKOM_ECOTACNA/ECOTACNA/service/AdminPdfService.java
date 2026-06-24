package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminCompanyDetailResponse;
import com.GAKOM_ECOTACNA.ECOTACNA.exception.BusinessException;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class AdminPdfService {

    private final AdminDashboardService adminDashboardService;

    @Autowired
    public AdminPdfService(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    public byte[] generarFichaPdf(Long companyId) {
        AdminCompanyDetailResponse detail = adminDashboardService.getEmpresaDetalle(companyId);

        Document document = new Document(PageSize.A4, 36, 36, 54, 36);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            BaseColor darkGreen = new BaseColor(11, 61, 46);
            BaseColor mainGreen = new BaseColor(22, 163, 74);
            BaseColor softBg = new BaseColor(244, 251, 247);
            BaseColor softLine = new BaseColor(221, 239, 229);

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, darkGreen);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 12, BaseColor.GRAY);
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, mainGreen);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11, BaseColor.BLACK);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, darkGreen);
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 9, BaseColor.GRAY);

            // Header Background Box (optional - we can just use colored text for simplicity or a colored cell)
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);
            PdfPCell headerCell = new PdfPCell();
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPaddingBottom(15);
            headerCell.setBorderWidthBottom(2f);
            headerCell.setBorderColorBottom(mainGreen);

            Paragraph title = new Paragraph("EcoTacna", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(title);

            Paragraph subtitle = new Paragraph(
                "RECOLECTORA".equalsIgnoreCase(detail.getCompanyType()) ? "Ficha de Recolectora" : "Ficha de Empresa", 
                subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            headerCell.addElement(subtitle);

            headerTable.addCell(headerCell);
            document.add(headerTable);

            document.add(new Paragraph("\n"));

            // Seccion 1: Datos de Empresa
            addSectionTitle(document, "Datos de Empresa", sectionFont);
            PdfPTable tableEmpresa = createTable();
            addRow(tableEmpresa, "Razón Social:", detail.getBusinessName(), boldFont, normalFont, softBg, softLine);
            addRow(tableEmpresa, "RUC:", detail.getRuc(), boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableEmpresa, "Tipo de Empresa:", detail.getCompanyType(), boldFont, normalFont, softBg, softLine);
            addRow(tableEmpresa, "Estado de Cuenta:", detail.getSubscriptionStatus(), boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableEmpresa, "Dirección Fiscal:", detail.getAddress(), boldFont, normalFont, softBg, softLine);
            addRow(tableEmpresa, "Ubicación:", detail.getDistrict() + ", " + detail.getProvince() + ", " + detail.getDepartment(), boldFont, normalFont, BaseColor.WHITE, softLine);
            document.add(tableEmpresa);

            // Seccion 2: Datos de Contacto
            addSectionTitle(document, "Contacto", sectionFont);
            PdfPTable tableContacto = createTable();
            addRow(tableContacto, "Usuario/Contacto:", detail.getContactName(), boldFont, normalFont, softBg, softLine);
            addRow(tableContacto, "Fecha de Inscripción:", formatDateTime(detail.getRegistrationDate()), boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableContacto, "Correo Electrónico:", detail.getContactEmail(), boldFont, normalFont, softBg, softLine);
            addRow(tableContacto, "Número Telefónico:", detail.getContactPhone(), boldFont, normalFont, BaseColor.WHITE, softLine);
            document.add(tableContacto);

            // Seccion 3: Suscripción y Pagos
            addSectionTitle(document, "Suscripción / Licencia Mensual", sectionFont);
            PdfPTable tableSub = createTable();
            addRow(tableSub, "Plan Actual:", detail.getPlanName() != null ? detail.getPlanName() : "Sin suscripción", boldFont, normalFont, softBg, softLine);
            addRow(tableSub, "Monto Mensual:", detail.getMonthlyAmount() != null ? "S/ " + detail.getMonthlyAmount() : "No registrado", boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableSub, "Estado de Suscripción:", detail.getSubscriptionStatus(), boldFont, normalFont, softBg, softLine);
            addRow(tableSub, "Fecha de Inicio:", formatDateTime(detail.getStartDate()), boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableSub, "Fecha de Vencimiento:", formatDateTime(detail.getCurrentPeriodEnd()), boldFont, normalFont, softBg, softLine);
            addRow(tableSub, "Último Pago Realizado:", detail.getLastPaymentAmount() != null ? "S/ " + detail.getLastPaymentAmount() : "No registrado", boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableSub, "Fecha Último Pago:", formatDateTime(detail.getLastPaymentDate()), boldFont, normalFont, softBg, softLine);
            document.add(tableSub);

            // Seccion 4: Actividad
            addSectionTitle(document, "Actividad", sectionFont);
            PdfPTable tableAct = createTable();
            addRow(tableAct, "Total de Solicitudes:", String.valueOf(detail.getTotalRequests() != null ? detail.getTotalRequests() : 0), boldFont, normalFont, softBg, softLine);
            addRow(tableAct, "Litros Acumulados:", detail.getTotalLitersCollected() != null ? detail.getTotalLitersCollected() + " L" : "0.0 L", boldFont, normalFont, BaseColor.WHITE, softLine);
            addRow(tableAct, "Última Actividad:", formatDateTime(detail.getLastActivityDate()), boldFont, normalFont, softBg, softLine);
            document.add(tableAct);

            // Seccion 5: Vehiculos (solo si es Recolectora)
            if ("RECOLECTORA".equalsIgnoreCase(detail.getCompanyType())) {
                addSectionTitle(document, "Vehículos Registrados", sectionFont);
                if (detail.getVehicles() != null && !detail.getVehicles().isEmpty()) {
                    for (int i = 0; i < detail.getVehicles().size(); i++) {
                        com.GAKOM_ECOTACNA.ECOTACNA.dto.AdminVehicleDto v = detail.getVehicles().get(i);
                        PdfPTable tableVeh = createTable();
                        BaseColor rowBg1 = (i % 2 == 0) ? softBg : BaseColor.WHITE;
                        BaseColor rowBg2 = (i % 2 == 0) ? BaseColor.WHITE : softBg;
                        
                        addRow(tableVeh, "Placa:", v.getPlate(), boldFont, normalFont, rowBg1, softLine);
                        addRow(tableVeh, "Tipo/Unidad:", v.getUnitType() != null ? v.getUnitType() : "No registrado", boldFont, normalFont, rowBg2, softLine);
                        addRow(tableVeh, "Capacidad (L):", v.getCapacityLiters() != null ? v.getCapacityLiters().toString() : "No registrado", boldFont, normalFont, rowBg1, softLine);
                        addRow(tableVeh, "Estado:", v.getStatus(), boldFont, normalFont, rowBg2, softLine);
                        addRow(tableVeh, "Marca/Modelo:", 
                            (v.getBrand() != null ? v.getBrand() : "No registrado") + " / " + (v.getModel() != null ? v.getModel() : "No registrado"), 
                            boldFont, normalFont, rowBg1, softLine);
                        addRow(tableVeh, "Fecha Registro:", formatDateTime(v.getRegistrationDate()), boldFont, normalFont, rowBg2, softLine);
                        
                        document.add(tableVeh);
                    }
                } else {
                    Paragraph emptyVehicles = new Paragraph("Sin vehículos registrados", normalFont);
                    emptyVehicles.setSpacingBefore(5);
                    emptyVehicles.setSpacingAfter(10);
                    document.add(emptyVehicles);
                }
            }

            // Footer
            Paragraph footer = new Paragraph("\nDocumento generado por EcoTacna - Gestión sostenible\n" + formatDateTime(LocalDateTime.now()), footerFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (DocumentException e) {
            throw new BusinessException("Error al generar el PDF de la empresa.");
        }

        return out.toByteArray();
    }

    private void addSectionTitle(Document document, String titleStr, Font font) throws DocumentException {
        Paragraph title = new Paragraph(titleStr, font);
        title.setSpacingBefore(15);
        title.setSpacingAfter(10);
        document.add(title);
    }

    private PdfPTable createTable() {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        try {
            table.setWidths(new float[]{35f, 65f});
        } catch (DocumentException e) {}
        table.setSpacingBefore(5);
        table.setSpacingAfter(10);
        return table;
    }

    private void addRow(PdfPTable table, String label, String value, Font labelFont, Font valueFont, BaseColor bgColor, BaseColor borderColor) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, labelFont));
        labelCell.setBorder(Rectangle.BOTTOM | Rectangle.TOP | Rectangle.LEFT | Rectangle.RIGHT);
        labelCell.setBorderColor(borderColor);
        labelCell.setBackgroundColor(bgColor);
        labelCell.setPadding(8);

        PdfPCell valueCell = new PdfPCell(new Phrase(value != null ? value : "No registrado", valueFont));
        valueCell.setBorder(Rectangle.BOTTOM | Rectangle.TOP | Rectangle.LEFT | Rectangle.RIGHT);
        valueCell.setBorderColor(borderColor);
        valueCell.setBackgroundColor(bgColor);
        valueCell.setPadding(8);

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) return "No registrado";
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        return dateTime.format(formatter);
    }
}
