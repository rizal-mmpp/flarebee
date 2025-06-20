
'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image as PdfImage } from '@react-pdf/renderer';
import type { JourneyStage } from '@/lib/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica', // Default font
    fontSize: 10,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 50,
    lineHeight: 1.5,
    color: '#333333', // Dark gray for text
  },
  header: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a237e', // Dark blue for header
    fontWeight: 'bold',
  },
  stageContainer: {
    marginBottom: 25,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0', // Light gray border
  },
  stageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0d47a1', // Medium blue for stage titles
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#424242', // Slightly lighter gray for section titles
  },
  text: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  image: {
    maxWidth: '100%', // Make image responsive within its container
    maxHeight: 300, // Limit image height
    marginVertical: 10,
    alignSelf: 'center', // Center images
    borderWidth: 0.5,
    borderColor: '#bdbdbd', // Light border for images
  },
  aiHint: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#757575', // Medium gray for AI hint
    marginTop: 5,
  },
  bulletPoint: {
    marginLeft: 10, // Indent bullet points
    marginBottom: 3,
  },
  noContent: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#9e9e9e', // Light gray for "no content" messages
  }
});

interface JourneyPdfDocumentProps {
  serviceTitle: string;
  stages: JourneyStage[];
}

// Helper to format details text (basic Markdown list to bullets)
const formatDetails = (detailsInput: string | undefined | null) => {
  const details = detailsInput || ''; // Ensure details is a string
  if (!details.trim()) {
    return <Text style={styles.noContent}>No details provided for this stage.</Text>;
  }
  const lines = details.split('\n');
  return lines.map((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ')) {
      return <Text key={`detail-line-${index}`} style={styles.bulletPoint}>• {trimmedLine.substring(2)}</Text>;
    }
    return <Text key={`detail-line-${index}`} style={styles.text}>{line}</Text>;
  });
};

export const JourneyPdfDocument: React.FC<JourneyPdfDocumentProps> = ({ serviceTitle, stages }) => (
  <Document title={`Service Journey - ${serviceTitle || 'Untitled Service'}`}>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Service Journey: {serviceTitle || 'Untitled Service'}</Text>

      {stages.length === 0 ? (
        <Text style={styles.noContent}>No journey stages defined for this service.</Text>
      ) : (
        stages.map((stage, index) => {
          const trimmedImageUrl = stage.imageUrl?.trim(); // Trim and check
          const stageKey = stage.id || `stage-fallback-${index}`; // Fallback key

          return (
            <View style={styles.stageContainer} key={stageKey} wrap={false}>
              <Text style={styles.stageTitle}>Stage {index + 1}: {stage.title || 'Untitled Stage'}</Text>
              
              <Text style={styles.sectionTitle}>Details:</Text>
              {formatDetails(stage.details)}

              {trimmedImageUrl ? (
                <>
                  <Text style={styles.sectionTitle}>Mockup / Image:</Text>
                  {/* @ts-ignore: @react-pdf/renderer Image src prop type is string, but can accept object for remote images if library supports it */}
                  <PdfImage style={styles.image} src={trimmedImageUrl} />
                </>
              ) : (
                <>
                  <Text style={styles.sectionTitle}>Mockup / Image:</Text>
                  <Text style={styles.noContent}>No image provided for this stage.</Text>
                </>
              )}

              {stage.imageAiHint && stage.imageAiHint.trim() && (
                <Text style={styles.aiHint}>AI Hint: {stage.imageAiHint.trim()}</Text>
              )}
            </View>
          );
        })
      )}
    </Page>
  </Document>
);

// Default export for dynamic import if needed, but named export is generally preferred for components.
export default JourneyPdfDocument;
