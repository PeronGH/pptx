using System.Text.Json;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;

if (args.Length != 1)
{
    Console.Error.WriteLine("usage: openxml-validate <file.pptx>");
    return 2;
}

using var doc = PresentationDocument.Open(args[0], false);
var errors = new OpenXmlValidator(FileFormatVersions.Microsoft365)
    .Validate(doc)
    .Select(e => $"{e.Part?.Uri} {e.Path?.XPath}: {e.Description}")
    .ToList();
Console.WriteLine(JsonSerializer.Serialize(errors));
return 0;
