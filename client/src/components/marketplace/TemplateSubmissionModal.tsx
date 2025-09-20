/**
 * Template Submission Modal Component
 * Allows creators to submit templates to the marketplace
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, type DropdownOption } from '@/components/ui/Dropdown';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { 
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Image,
  DollarSign,
  Eye,
  Send,
  Save,
  Plus,
  Minus,
  Zap,
  Target,
  Settings,
  Crown,
  Gift,
  Award,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { marketplaceApi } from '@/services/marketplaceApi';

// Validation schema
const templateSubmissionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  category: z.enum(['novel', 'screenplay', 'non-fiction', 'world-building', 'character', 'marketing']),
  genre: z.array(z.string()).min(1, 'Select at least one genre'),
  subgenre: z.array(z.string()).optional(),
  structure: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tags: z.array(z.string()).min(1, 'Add at least one tag'),
  targetWordCount: z.number().min(100, 'Must be at least 100 words'),
  estimatedDuration: z.string().optional(),
  targetAudience: z.string().optional(),
  writingLevel: z.string().optional(),
  licenseType: z.enum(['free', 'premium', 'exclusive']).default('free'),
  price: z.number().min(0).optional(),
  previewContent: z.string().optional(),
  coverImage: z.string().optional(),
  screenshots: z.array(z.string()).optional(),
  templateData: z.string().min(1, 'Template data is required'),
});

type TemplateSubmissionForm = z.infer<typeof templateSubmissionSchema>;

interface TemplateSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (submission: any) => void;
  className?: string;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  advanced: 'bg-red-100 text-red-800 border-red-200',
};

const DIFFICULTY_ICONS = {
  beginner: <Zap className="h-3 w-3" />,
  intermediate: <Target className="h-3 w-3" />,
  advanced: <Settings className="h-3 w-3" />,
};

const LICENSE_ICONS = {
  free: <Gift className="h-4 w-4 text-green-600" />,
  premium: <Crown className="h-4 w-4 text-yellow-600" />,
  exclusive: <Award className="h-4 w-4 text-purple-600" />,
};

export function TemplateSubmissionModal({
  isOpen,
  onClose,
  onSubmit,
  className
}: TemplateSubmissionModalProps) {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isValid },
    reset,
  } = useForm<TemplateSubmissionForm>({
    resolver: zodResolver(templateSubmissionSchema),
    defaultValues: {
      category: 'novel',
      difficulty: 'beginner',
      licenseType: 'free',
      genre: [],
      tags: [],
      screenshots: [],
      targetWordCount: 50000,
      price: 0,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const totalSteps = 4;

  // Form options
  const categoryOptions: DropdownOption[] = [
    { value: 'novel', label: 'Novel Templates', description: 'Complete story structures and frameworks' },
    { value: 'screenplay', label: 'Screenplay Templates', description: 'Script formats and story beats' },
    { value: 'non-fiction', label: 'Non-Fiction Templates', description: 'Educational and informational content' },
    { value: 'world-building', label: 'World-Building Templates', description: 'Fantasy and sci-fi world creation' },
    { value: 'character', label: 'Character Templates', description: 'Character development frameworks' },
    { value: 'marketing', label: 'Marketing Templates', description: 'Query letters, synopses, and promotion' },
  ];

  const genreOptions: DropdownOption[] = [
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'science-fiction', label: 'Science Fiction' },
    { value: 'romance', label: 'Romance' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'thriller', label: 'Thriller' },
    { value: 'horror', label: 'Horror' },
    { value: 'literary', label: 'Literary Fiction' },
    { value: 'young-adult', label: 'Young Adult' },
    { value: 'historical', label: 'Historical Fiction' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'crime', label: 'Crime' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'drama', label: 'Drama' },
    { value: 'comedy', label: 'Comedy' },
    { value: 'biography', label: 'Biography' },
    { value: 'memoir', label: 'Memoir' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' },
    { value: 'academic', label: 'Academic' },
    { value: 'technical', label: 'Technical' },
  ];

  const structureOptions: DropdownOption[] = [
    { value: 'three-act', label: 'Three-Act Structure' },
    { value: 'five-act', label: 'Five-Act Structure' },
    { value: 'hero-journey', label: "Hero's Journey" },
    { value: 'save-the-cat', label: 'Save the Cat' },
    { value: 'snowflake', label: 'Snowflake Method' },
    { value: 'freytag', label: "Freytag's Pyramid" },
    { value: 'seven-point', label: 'Seven-Point Story Structure' },
    { value: 'custom', label: 'Custom Structure' },
  ];

  const difficultyOptions: DropdownOption[] = [
    { value: 'beginner', label: 'Beginner', icon: DIFFICULTY_ICONS.beginner, description: 'Easy to follow, great for new writers' },
    { value: 'intermediate', label: 'Intermediate', icon: DIFFICULTY_ICONS.intermediate, description: 'Some experience required' },
    { value: 'advanced', label: 'Advanced', icon: DIFFICULTY_ICONS.advanced, description: 'Complex, for experienced writers' },
  ];

  const licenseOptions: DropdownOption[] = [
    { value: 'free', label: 'Free', icon: LICENSE_ICONS.free, description: 'Available to everyone at no cost' },
    { value: 'premium', label: 'Premium', icon: LICENSE_ICONS.premium, description: 'Paid template with revenue sharing' },
    { value: 'exclusive', label: 'Exclusive', icon: LICENSE_ICONS.exclusive, description: 'High-value, limited availability' },
  ];

  // Handlers
  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !watchedValues.tags.includes(tagInput.trim())) {
      setValue('tags', [...watchedValues.tags, tagInput.trim()]);
      setTagInput('');
    }
  }, [tagInput, watchedValues.tags, setValue]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setValue('tags', watchedValues.tags.filter(tag => tag !== tagToRemove));
  }, [watchedValues.tags, setValue]);

  const handleAddGenre = useCallback((genre: string) => {
    if (!watchedValues.genre.includes(genre)) {
      setValue('genre', [...watchedValues.genre, genre]);
    }
  }, [watchedValues.genre, setValue]);

  const handleRemoveGenre = useCallback((genreToRemove: string) => {
    setValue('genre', watchedValues.genre.filter(genre => genre !== genreToRemove));
  }, [watchedValues.genre, setValue]);

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // For demo purposes, we'll just add placeholder URLs
      const newScreenshots = newFiles.map(file => URL.createObjectURL(file));
      setValue('screenshots', [...(watchedValues.screenshots || []), ...newScreenshots]);
    }
  }, [watchedValues.screenshots, setValue]);

  const handleNextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const onFormSubmit = useCallback(async (data: TemplateSubmissionForm) => {
    setIsSubmitting(true);
    try {
      const submission = await marketplaceApi.submitTemplate(data);
      
      toast.success('Template submitted successfully! It will be reviewed by our team.');
      onSubmit?.(submission);
      onClose();
      reset();
      setCurrentStep(1);
    } catch (error) {
      console.error('Error submitting template:', error);
      toast.error('Failed to submit template. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [toast, onSubmit, onClose, reset]);

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <React.Fragment key={i}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
            i + 1 <= currentStep 
              ? "bg-cosmic-600 text-white" 
              : "bg-gray-200 text-gray-600"
          )}>
            {i + 1 < currentStep ? (
              <Check className="h-4 w-4" />
            ) : (
              i + 1
            )}
          </div>
          {i < totalSteps - 1 && (
            <div className={cn(
              "w-12 h-1 mx-2 transition-colors",
              i + 1 < currentStep ? "bg-cosmic-600" : "bg-gray-200"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
        <p className="text-muted-foreground">Tell us about your template</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Template Title *</label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g., Three-Act Romance Novel Template"
                error={errors.title?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Describe what your template offers, who it's for, and what makes it unique..."
                rows={4}
                error={errors.description?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={categoryOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select a category"
                error={errors.category?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Word Count *</label>
          <Controller
            name="targetWordCount"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                placeholder="50000"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                error={errors.targetWordCount?.message}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Estimated Duration</label>
          <Controller
            name="estimatedDuration"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g., 3-6 months, 2-4 weeks"
              />
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Classification</h3>
        <p className="text-muted-foreground">Help users find your template</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Genres *</label>
          <div className="space-y-2">
            <Dropdown
              options={genreOptions}
              value=""
              onChange={(value) => handleAddGenre(value)}
              placeholder="Add genres..."
            />
            <div className="flex flex-wrap gap-2">
              {watchedValues.genre.map(genre => (
                <Badge key={genre} variant="secondary" className="flex items-center gap-1">
                  {genre}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveGenre(genre)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Story Structure</label>
          <Controller
            name="structure"
            control={control}
            render={({ field }) => (
              <Dropdown
                options={structureOptions}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="Select a structure"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Difficulty Level *</label>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {difficultyOptions.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={field.value === option.value ? "default" : "outline"}
                    onClick={() => field.onChange(option.value)}
                    className="flex flex-col items-center p-4 h-auto"
                  >
                    {option.icon}
                    <span className="text-xs mt-1">{option.label}</span>
                  </Button>
                ))}
              </div>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tags *</label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add tags..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {watchedValues.tags.map(tag => (
                <Badge key={tag} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Target Audience</label>
          <Controller
            name="targetAudience"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g., Young Adult, Adult, Literary"
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Writing Level</label>
          <Controller
            name="writingLevel"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="e.g., Amateur, Professional, Expert"
              />
            )}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Pricing & Media</h3>
        <p className="text-muted-foreground">Set your pricing and add visuals</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">License Type *</label>
          <Controller
            name="licenseType"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-2">
                {licenseOptions.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={field.value === option.value ? "default" : "outline"}
                    onClick={() => field.onChange(option.value)}
                    className="flex flex-col items-center p-4 h-auto"
                  >
                    {option.icon}
                    <span className="text-xs mt-1">{option.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          />
        </div>

        {watchedValues.licenseType !== 'free' && (
          <div>
            <label className="block text-sm font-medium mb-2">Price (USD) *</label>
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="9.99"
                    className="pl-9"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            />
            <p className="text-xs text-muted-foreground mt-1">
              You'll receive 70% of the sale price
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload a cover image for your template
            </p>
            <Button type="button" variant="outline" size="sm">
              <Upload className="h-3 w-3 mr-1" />
              Choose Image
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Screenshots</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Add screenshots or examples of your template
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="screenshots-upload"
            />
            <label htmlFor="screenshots-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Screenshots
                </span>
              </Button>
            </label>
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-20 object-cover rounded"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    className="absolute top-1 right-1"
                    onClick={() => {
                      setUploadedFiles(prev => prev.filter((_, i) => i !== index));
                      setValue('screenshots', watchedValues.screenshots?.filter((_, i) => i !== index) || []);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Preview Content</label>
          <Controller
            name="previewContent"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Add a sample of your template content for preview..."
                rows={6}
              />
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            This will be shown to users before they purchase/download
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Template Content</h3>
        <p className="text-muted-foreground">Upload your template data</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Template Data *</label>
          <Controller
            name="templateData"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Paste your template JSON data here..."
                rows={12}
                className="font-mono text-sm"
                error={errors.templateData?.message}
              />
            )}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload the complete template structure in JSON format
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">Template Guidelines</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Include clear section descriptions and purposes</li>
                <li>• Provide helpful writing prompts and guidance</li>
                <li>• Ensure content is original and properly attributed</li>
                <li>• Test your template structure before submission</li>
                <li>• Follow our community guidelines and terms of service</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-medium text-yellow-900 mb-1">Review Process</h4>
              <p className="text-yellow-800">
                Your template will be reviewed by our editorial team within 2-3 business days. 
                You'll receive an email notification once the review is complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-4xl"
        >
          <Card className="max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Submit Template to Marketplace</CardTitle>
                <Button variant="ghost" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onFormSubmit)}>
                {renderStepIndicator()}
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  
                  <div className="flex gap-2">
                    {currentStep < totalSteps ? (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={!isValid || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Template
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}