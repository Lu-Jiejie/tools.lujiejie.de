## What Is a Mock Data Generator

A **mock data generator** creates realistic sample data from a data model definition. It is useful for testing, prototyping, demos, and filling out UI states before real data is available.

This tool parses a data model written in JSON, SQL, TypeScript, JavaScript, Java, XML, or Go, infers a mock type for each field, and generates as many records as you need.

## How It Works

- The parser reads field names and rough types from your JSON, SQL, TypeScript, Java, XML, or Go code.
- Field names such as `email`, `phone`, `date`, `id`, and `image` are mapped to matching mock types. Other fields may need manual adjustment.
- Review the field list before generating. For enum fields, fill in the values in the Options column, separated by commas.
- Choose how many records to create, then copy the result or download it as JSON.

## Notes

- Type inference is based on field names and rough type hints, so always review the field list before generating.
- All parsing and generation runs locally in your browser. Nothing is uploaded to a server.
