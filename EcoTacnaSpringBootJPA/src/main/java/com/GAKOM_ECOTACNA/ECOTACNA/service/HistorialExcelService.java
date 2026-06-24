package com.GAKOM_ECOTACNA.ECOTACNA.service;

import com.GAKOM_ECOTACNA.ECOTACNA.model.Company;
import com.GAKOM_ECOTACNA.ECOTACNA.model.PickupRequest;
import com.GAKOM_ECOTACNA.ECOTACNA.model.User;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class HistorialExcelService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] generateCompanyExcel(List<PickupRequest> requests, Company company, String desde, String hasta) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Historial Empresa");

            // Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            dateStyle.setDataFormat(format.getFormat("dd/mm/yyyy hh:mm"));
            
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(format.getFormat("\"S/ \"#,##0.00"));

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Reporte de Solicitudes EcoTacna - " + company.getBusinessName());
            titleCell.setCellStyle(headerStyle);

            Row dateRow = sheet.createRow(1);
            dateRow.createCell(0).setCellValue("Desde: " + desde + " Hasta: " + hasta);

            // Headers
            String[] headers = {
                    "ID Solicitud", "Fecha Solicitud", "Fecha Programada", "Estado Recojo", "Estado Pago",
                    "Dirección", "Observaciones", "Volumen Aproximado (L)", "Precio Ofertado por Litro",
                    "Monto Estimado", "Litros Confirmados", "Precio Aplicado por Litro", "Monto Total Final",
                    "Fecha Confirmación Pago", "Empresa Recolectora", "RUC Recolectora", "Unidad", "Placa"
            };

            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowIdx = 4;
            for (PickupRequest request : requests) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(request.getId() != null ? request.getId().toString() : "");
                row.createCell(1).setCellValue(request.getRequestedAt() != null ? request.getRequestedAt().format(DATE_FORMATTER) : "");
                row.createCell(2).setCellValue(request.getScheduledAt() != null ? request.getScheduledAt().format(DATE_FORMATTER) : "");
                row.createCell(3).setCellValue(request.getStatus() != null ? request.getStatus().name() : "");
                row.createCell(4).setCellValue(request.getEstadoPago() != null ? request.getEstadoPago() : "PENDIENTE");
                
                String address = request.getCompany() != null ? request.getCompany().getAddress() : "";
                row.createCell(5).setCellValue(address);
                
                row.createCell(6).setCellValue(request.getObservaciones() != null ? request.getObservaciones() : "");
                
                if (request.getApproximateVolumeLiters() != null) {
                    row.createCell(7).setCellValue(request.getApproximateVolumeLiters().doubleValue());
                }
                
                if (request.getPrecioOfertadoPorLitro() != null) {
                    Cell cell = row.createCell(8);
                    cell.setCellValue(request.getPrecioOfertadoPorLitro().doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                if (request.getApproximateVolumeLiters() != null && request.getPrecioOfertadoPorLitro() != null) {
                    Cell cell = row.createCell(9);
                    cell.setCellValue(request.getApproximateVolumeLiters().multiply(request.getPrecioOfertadoPorLitro()).doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                if (request.getActualVolumeLiters() != null) {
                    row.createCell(10).setCellValue(request.getActualVolumeLiters().doubleValue());
                }
                
                if (request.getPrecioPorLitro() != null) {
                    Cell cell = row.createCell(11);
                    cell.setCellValue(request.getPrecioPorLitro().doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                if (request.getMontoTotal() != null) {
                    Cell cell = row.createCell(12);
                    cell.setCellValue(request.getMontoTotal().doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                row.createCell(13).setCellValue(request.getFechaConfirmacionPago() != null ? request.getFechaConfirmacionPago().format(DATE_FORMATTER) : "");
                
                String recolectorName = "";
                String recolectorRuc = "";
                String unidad = "";
                String placa = "";
                
                if (request.getTransportUnit() != null) {
                    unidad = request.getTransportUnit().getBrand() + " " + request.getTransportUnit().getModel();
                    placa = request.getTransportUnit().getPlate();
                    if (request.getTransportUnit().getCollectorCompany() != null) {
                        recolectorName = request.getTransportUnit().getCollectorCompany().getBusinessName();
                        recolectorRuc = request.getTransportUnit().getCollectorCompany().getRuc();
                    }
                }
                
                row.createCell(14).setCellValue(recolectorName);
                row.createCell(15).setCellValue(recolectorRuc);
                row.createCell(16).setCellValue(unidad);
                row.createCell(17).setCellValue(placa);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] generateCollectorExcel(List<PickupRequest> requests, User collectorUser, String desde, String hasta) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Historial Recolector");

            // Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dateStyle = workbook.createCellStyle();
            DataFormat format = workbook.createDataFormat();
            dateStyle.setDataFormat(format.getFormat("dd/mm/yyyy hh:mm"));
            
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(format.getFormat("\"S/ \"#,##0.00"));

            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            String recolectorName = collectorUser.getCompany() != null ? collectorUser.getCompany().getBusinessName() : collectorUser.getFirstName() + " " + collectorUser.getLastName();
            titleCell.setCellValue("Historial de Recojos EcoTacna - " + recolectorName);
            titleCell.setCellStyle(headerStyle);

            Row dateRow = sheet.createRow(1);
            dateRow.createCell(0).setCellValue("Desde: " + desde + " Hasta: " + hasta);

            // Headers
            String[] headers = {
                    "ID Solicitud", "Restaurante / Empresa Generadora", "RUC Restaurante", "Fecha Solicitud", 
                    "Fecha Programada", "Estado Recojo", "Estado Pago", "Dirección", "Observaciones", 
                    "Volumen Aproximado (L)", "Precio Ofertado por Litro", "Monto Estimado", "Litros Confirmados", 
                    "Precio Aplicado por Litro", "Monto Total Final", "Fecha Confirmación Pago", "Unidad", "Placa"
            };

            Row headerRow = sheet.createRow(3);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data
            int rowIdx = 4;
            for (PickupRequest request : requests) {
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(request.getId() != null ? request.getId().toString() : "");
                
                String generadoraName = request.getCompany() != null ? request.getCompany().getBusinessName() : "";
                String generadoraRuc = request.getCompany() != null ? request.getCompany().getRuc() : "";
                row.createCell(1).setCellValue(generadoraName);
                row.createCell(2).setCellValue(generadoraRuc);
                
                row.createCell(3).setCellValue(request.getRequestedAt() != null ? request.getRequestedAt().format(DATE_FORMATTER) : "");
                row.createCell(4).setCellValue(request.getScheduledAt() != null ? request.getScheduledAt().format(DATE_FORMATTER) : "");
                row.createCell(5).setCellValue(request.getStatus() != null ? request.getStatus().name() : "");
                row.createCell(6).setCellValue(request.getEstadoPago() != null ? request.getEstadoPago() : "PENDIENTE");
                
                String address = request.getCompany() != null ? request.getCompany().getAddress() : "";
                row.createCell(7).setCellValue(address);
                
                row.createCell(8).setCellValue(request.getObservaciones() != null ? request.getObservaciones() : "");
                
                if (request.getApproximateVolumeLiters() != null) {
                    row.createCell(9).setCellValue(request.getApproximateVolumeLiters().doubleValue());
                }
                
                if (request.getPrecioOfertadoPorLitro() != null) {
                    Cell cell = row.createCell(10);
                    cell.setCellValue(request.getPrecioOfertadoPorLitro().doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                if (request.getApproximateVolumeLiters() != null && request.getPrecioOfertadoPorLitro() != null) {
                    Cell cell = row.createCell(11);
                    cell.setCellValue(request.getApproximateVolumeLiters().multiply(request.getPrecioOfertadoPorLitro()).doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                if (request.getActualVolumeLiters() != null) {
                    row.createCell(12).setCellValue(request.getActualVolumeLiters().doubleValue());
                }
                
                if (request.getPrecioPorLitro() != null) {
                    Cell cell = row.createCell(13);
                    cell.setCellValue(request.getPrecioPorLitro().doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                if (request.getMontoTotal() != null) {
                    Cell cell = row.createCell(14);
                    cell.setCellValue(request.getMontoTotal().doubleValue());
                    cell.setCellStyle(currencyStyle);
                }
                
                row.createCell(15).setCellValue(request.getFechaConfirmacionPago() != null ? request.getFechaConfirmacionPago().format(DATE_FORMATTER) : "");
                
                String unidad = "";
                String placa = "";
                if (request.getTransportUnit() != null) {
                    unidad = request.getTransportUnit().getBrand() + " " + request.getTransportUnit().getModel();
                    placa = request.getTransportUnit().getPlate();
                }
                
                row.createCell(16).setCellValue(unidad);
                row.createCell(17).setCellValue(placa);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }
}
